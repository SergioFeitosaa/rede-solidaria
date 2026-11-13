import {
  dismissSuggestion,
  listMatches,
  registerInterest,
  resolveActor,
  suggestionsForOffer,
  suggestionsForRequest
} from "@/modules/matching/service";
import { toResponse, DomainError } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth";
import { readOwnerSession } from "@/lib/session";
import { clientKey, matchLimiter, tooManyRequests } from "@/lib/rate-limit";

/**
 * GET /api/matches
 * - ?requestId= → recomendações de ofertas para um pedido (público).
 * - ?offerId=   → recomendações de pedidos para uma oferta (público).
 * - sem filtro  → matches registrados. Dado operacional: só para a Central.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const requestId = url.searchParams.get("requestId");
    const offerId = url.searchParams.get("offerId");

    if (requestId) {
      const suggestions = await suggestionsForRequest(requestId);
      return Response.json({ suggestions });
    }
    if (offerId) {
      const suggestions = await suggestionsForOffer(offerId);
      return Response.json({ suggestions });
    }

    // Lista completa de conexões só com token administrativo.
    const denied = requireAdmin(req);
    if (denied) return denied;

    const matches = await listMatches({ status: url.searchParams.get("status") ?? undefined });
    return Response.json({ matches });
  } catch (err) {
    return toResponse(err);
  }
}

/**
 * POST /api/matches
 * - { requestId, offerId, who } → registra interesse (swipe à direita).
 * - { action: "PASS", requestId, offerId, who } → registra dispensa (swipe à esquerda),
 *   para o cartão não voltar na próxima visita.
 */
export async function POST(req: Request) {
  try {
    const limit = matchLimiter(clientKey(req));
    if (!limit.ok) return tooManyRequests(limit);

    const body = await req.json();
    const declaredWho = body.who === "provider" ? "provider" : body.who === "requester" ? "requester" : null;
    if (!declaredWho || !body.requestId || !body.offerId) {
      throw new DomainError("Informe requestId, offerId e who ('requester' ou 'provider').", 400);
    }

    // Quem age é decidido AQUI: o cliente não pode declarar consentimento alheio.
    const session = await readOwnerSession();
    const who = await resolveActor({
      requestId: String(body.requestId),
      offerId: String(body.offerId),
      declaredWho,
      session
    });

    if (body.action === "PASS") {
      await dismissSuggestion({ requestId: String(body.requestId), offerId: String(body.offerId), who });
      return Response.json({ dismissed: true });
    }

    const result = await registerInterest({
      requestId: String(body.requestId),
      offerId: String(body.offerId),
      who
    });
    return Response.json({ ...result, actor: who }, { status: 201 });
  } catch (err) {
    return toResponse(err);
  }
}
