import { getDb, newId, type Database } from "@/lib/db";
import { DomainError } from "@/lib/errors";
import { evaluateCompatibility, type CompatibilityReport, type EntitySummary } from "./engine";
import { getRequest, listRequests, type RequestRecord } from "@/modules/requests/service";
import { getOffer, listOffers, type OfferRecord } from "@/modules/offers/service";

/**
 * Módulo C — Match Solidário (um único motor para os dois perfis).
 *
 * "Preciso de ajuda" → sugere OFERTAS compatíveis com um pedido.
 * "Quero ajudar"     → sugere PEDIDOS compatíveis com uma oferta.
 * O Swipe registra interesse; a confirmação do atendimento é da organização.
 */

export interface MatchRecord {
  id: string;
  requestId: string;
  offerId: string;
  compatibilityReason: string;
  requesterInterested: boolean;
  providerInterested: boolean;
  status: "SUGGESTED" | "INTERESTED" | "PENDING_CONFIRMATION" | "CONFIRMED" | "REJECTED";
  createdAt: string;
}

interface MatchRow {
  id: string;
  request_id: string;
  offer_id: string;
  compatibility_reason: string;
  requester_interested: boolean;
  provider_interested: boolean;
  status: MatchRecord["status"];
  created_at: string | Date;
}

function toRecord(row: MatchRow): MatchRecord {
  return {
    id: row.id,
    requestId: row.request_id,
    offerId: row.offer_id,
    compatibilityReason: row.compatibility_reason,
    requesterInterested: row.requester_interested,
    providerInterested: row.provider_interested,
    status: row.status,
    createdAt: String(row.created_at)
  };
}

export interface MatchDeps {
  db?: Database;
}

export function summarizeRequest(r: RequestRecord): EntitySummary {
  return { category: r.category, item: r.item, quantity: r.quantity, region: r.region };
}

export function summarizeOffer(o: OfferRecord): EntitySummary {
  return { category: o.category, item: o.item, quantity: o.quantity, region: o.region };
}

export interface MatchSuggestion {
  request: RequestRecord;
  offer: OfferRecord;
  report: CompatibilityReport;
  matchId: string | null;
}

async function upsertSuggestedMatch(
  db: Database,
  request: RequestRecord,
  offer: OfferRecord,
  report: CompatibilityReport
): Promise<MatchRecord> {
  const [existing] = await db.query<MatchRow>(
    "SELECT * FROM matches WHERE request_id = $1 AND offer_id = $2",
    [request.id, offer.id]
  );
  if (existing) return toRecord(existing);
  const [row] = await db.query<MatchRow>(
    `INSERT INTO matches (id, request_id, offer_id, compatibility_reason, status)
     VALUES ($1, $2, $3, $4, 'SUGGESTED')
     ON CONFLICT (request_id, offer_id) DO NOTHING
     RETURNING *`,
    [newId(), request.id, offer.id, report.reason]
  );
  if (row) return toRecord(row);
  const [again] = await db.query<MatchRow>(
    "SELECT * FROM matches WHERE request_id = $1 AND offer_id = $2",
    [request.id, offer.id]
  );
  return toRecord(again);
}

/** Sugestões para um pedido (ofertas compatíveis). */
export async function suggestionsForRequest(
  requestId: string,
  deps: MatchDeps = {}
): Promise<MatchSuggestion[]> {
  const db = deps.db ?? (await getDb());
  const request = await getRequest(requestId, { db });
  if (!request) throw new DomainError("Pedido não encontrado.", 404);
  const offers = await listOffers({ status: "AVAILABLE" }, { db });

  const suggestions: MatchSuggestion[] = [];
  for (const offer of offers) {
    const report = evaluateCompatibility(summarizeRequest(request), summarizeOffer(offer));
    if (report.compatible) {
      const match = await upsertSuggestedMatch(db, request, offer, report);
      suggestions.push({ request, offer, report, matchId: match.id });
    }
  }
  suggestions.sort((a, b) => b.report.score - a.report.score);
  return suggestions;
}

/** Sugestões para uma oferta (pedidos compatíveis, já validados pela organização). */
export async function suggestionsForOffer(
  offerId: string,
  deps: MatchDeps = {}
): Promise<MatchSuggestion[]> {
  const db = deps.db ?? (await getDb());
  const offer = await getOffer(offerId, { db });
  if (!offer) throw new DomainError("Oferta não encontrada.", 404);
  const requests = await listRequests({ status: "VALIDATED" }, { db });

  const suggestions: MatchSuggestion[] = [];
  for (const request of requests) {
    const report = evaluateCompatibility(summarizeRequest(request), summarizeOffer(offer));
    if (report.compatible) {
      const match = await upsertSuggestedMatch(db, request, offer, report);
      suggestions.push({ request, offer, report, matchId: match.id });
    }
  }
  suggestions.sort((a, b) => b.report.score - a.report.score);
  return suggestions;
}

export interface InterestResult {
  match: MatchRecord;
  mutualInterest: boolean;
}

/**
 * Registra interesse (Swipe à direita / botão "Tenho interesse").
 * Um Swipe NÃO representa doação concluída — só a organização confirma.
 */
export async function registerInterest(
  input: { requestId: string; offerId: string; who: "requester" | "provider" },
  deps: MatchDeps = {}
): Promise<InterestResult> {
  const db = deps.db ?? (await getDb());
  const request = await getRequest(input.requestId, { db });
  const offer = await getOffer(input.offerId, { db });
  if (!request) throw new DomainError("Pedido não encontrado.", 404);
  if (!offer) throw new DomainError("Oferta não encontrada.", 404);
  if (request.status !== "VALIDATED") {
    throw new DomainError("Pedidos só entram em match depois de validados pela organização.", 409);
  }
  if (offer.status !== "AVAILABLE") {
    throw new DomainError("Esta oferta não está disponível.", 409);
  }

  const report = evaluateCompatibility(summarizeRequest(request), summarizeOffer(offer));
  if (!report.compatible) {
    throw new DomainError(report.reason, 409);
  }

  const existing = await upsertSuggestedMatch(db, request, offer, report);
  const requesterInterested = existing.requesterInterested || input.who === "requester";
  const providerInterested = existing.providerInterested || input.who === "provider";
  const mutual = requesterInterested && providerInterested;
  const status = mutual ? "PENDING_CONFIRMATION" : "INTERESTED";

  const [updated] = await db.query<MatchRow>(
    `UPDATE matches
        SET requester_interested = $2, provider_interested = $3, status = $4
      WHERE id = $1
      RETURNING *`,
    [existing.id, requesterInterested, providerInterested, status]
  );
  return { match: toRecord(updated), mutualInterest: mutual };
}

export interface MatchDepsWithDb extends MatchDeps {}

/** Ações da organização sobre um match. */
export async function updateMatchByOrg(
  id: string,
  action: "CONFIRM" | "REJECT",
  validatedBy: string,
  deps: MatchDeps = {}
): Promise<{ match: MatchRecord; attendanceId: string | null }> {
  const db = deps.db ?? (await getDb());
  const [row] = await db.query<MatchRow>("SELECT * FROM matches WHERE id = $1", [id]);
  if (!row) throw new DomainError("Match não encontrado.", 404);
  const match = toRecord(row);

  if (match.status === "CONFIRMED" || match.status === "REJECTED") {
    throw new DomainError(`Match já está ${match.status}.`, 409);
  }

  if (action === "REJECT") {
    const [updated] = await db.query<MatchRow>(
      "UPDATE matches SET status = 'REJECTED' WHERE id = $1 RETURNING *",
      [id]
    );
    return { match: toRecord(updated), attendanceId: null };
  }

  // CONFIRM: protege contra comprometer a mesma oferta duas vezes.
  const offer = await getOffer(match.offerId, { db });
  if (!offer) throw new DomainError("Oferta não encontrada.", 404);
  if (offer.status !== "AVAILABLE") {
    throw new DomainError("Oferta já comprometida em outro atendimento. Confirmação duplicada não é permitida.", 409);
  }
  const request = await getRequest(match.requestId, { db });
  if (!request || request.status !== "VALIDATED") {
    throw new DomainError("Somente pedidos validados podem ter atendimento confirmado.", 409);
  }

  const [confirmed] = await db.query<MatchRow>(
    "UPDATE matches SET status = 'CONFIRMED' WHERE id = $1 RETURNING *",
    [id]
  );
  await db.query("UPDATE help_offers SET status = 'RESERVED' WHERE id = $1", [match.offerId]);

  const attendanceId = newId();
  await db.query(
    `INSERT INTO attendances (id, match_id, status, validated_by)
     VALUES ($1, $2, 'PENDING', $3)`,
    [attendanceId, id, validatedBy]
  );
  return { match: toRecord(confirmed), attendanceId };
}

export async function listMatches(
  filters: { status?: string } = {},
  deps: MatchDeps = {}
): Promise<MatchRecord[]> {
  const db = deps.db ?? (await getDb());
  const params: unknown[] = [];
  let where = "";
  if (filters.status) {
    params.push(filters.status);
    where = "WHERE status = $1";
  }
  const rows = await db.query<MatchRow>(
    `SELECT * FROM matches ${where} ORDER BY created_at DESC LIMIT 200`,
    params as never
  );
  return rows.map(toRecord);
}

export async function getMatch(id: string, deps: MatchDeps = {}): Promise<MatchRecord | null> {
  const db = deps.db ?? (await getDb());
  const [row] = await db.query<MatchRow>("SELECT * FROM matches WHERE id = $1", [id]);
  return row ? toRecord(row) : null;
}
