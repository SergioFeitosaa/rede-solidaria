import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type Database } from "@/lib/db";
import { createRequest, reviewRequest, updateRequestStatus, getRequest } from "@/modules/requests/service";
import { createOffer } from "@/modules/offers/service";
import { dismissSuggestion, suggestionsForRequest } from "@/modules/matching/service";
import type { ClassifyFn } from "@/modules/ai/classify";

/**
 * Teste do "swipe que lembra": o cartão dispensado não pode voltar na próxima
 * consulta, e o código curto precisa ser único e estável.
 */

const noAi: ClassifyFn = async () => ({ status: "UNAVAILABLE", reason: "teste automatizado (IA mockada)." });

async function seedValidatedRequest(db: Database) {
  const { request } = await createRequest(
    {
      name: "Família Nascimento (DEMONSTRAÇÃO — fictício)",
      region: "Ibura",
      category: "Colchões",
      item: "colchão",
      quantity: 2,
      description: "Perdemos os colchões no alagamento e precisamos de dois.",
      contactMethod: "retornar pela Central"
    },
    { db, classify: noAi }
  );
  await reviewRequest(request.id, { categoria: "Colchões", item: "colchão", quantity: 2 }, { db });
  await updateRequestStatus(request.id, "VALIDATED", { db });
  return request;
}

async function seedOffer(db: Database) {
  return createOffer(
    {
      name: "Doador Paulo (DEMONSTRAÇÃO — fictício)",
      type: "DONATION",
      category: "Colchões",
      item: "colchão",
      quantity: 2,
      region: "Ibura",
      availability: "imediata",
      description: "Tenho dois colchões de solteiro em bom estado para doar."
    },
    { db }
  );
}

describe("Match — dispensa (swipe para a esquerda)", () => {
  let db: Database;

  beforeEach(async () => {
    db = await createTestDb();
  });

  it("o cartão dispensado deixa de ser sugerido para o mesmo ator", async () => {
    const request = await seedValidatedRequest(db);
    const offer = await seedOffer(db);

    const before = await suggestionsForRequest(request.id, { db });
    expect(before.map((s) => s.offer.id)).toContain(offer.id);

    await dismissSuggestion({ requestId: request.id, offerId: offer.id, who: "requester" }, { db });

    const after = await suggestionsForRequest(request.id, { db });
    expect(after.map((s) => s.offer.id)).not.toContain(offer.id);
  });

  it("dispensar duas vezes não quebra (idempotente)", async () => {
    const request = await seedValidatedRequest(db);
    const offer = await seedOffer(db);

    await dismissSuggestion({ requestId: request.id, offerId: offer.id, who: "requester" }, { db });
    await dismissSuggestion({ requestId: request.id, offerId: offer.id, who: "requester" }, { db });

    const rows = await db.query<{ total: number }>(
      "SELECT COUNT(*)::int AS total FROM match_dismissals WHERE request_id = $1 AND offer_id = $2",
      [request.id, offer.id]
    );
    expect(rows[0]?.total).toBe(1);
  });

  it("a dispensa do morador não esconde o cartão do doador (atores separados)", async () => {
    const request = await seedValidatedRequest(db);
    const offer = await seedOffer(db);

    await dismissSuggestion({ requestId: request.id, offerId: offer.id, who: "provider" }, { db });

    const stillSuggested = await suggestionsForRequest(request.id, { db });
    expect(stillSuggested.map((s) => s.offer.id)).toContain(offer.id);
  });
});

describe("Pedido — código curto para o morador acompanhar", () => {
  let db: Database;

  beforeEach(async () => {
    db = await createTestDb();
  });

  it("gera código curto no formato RS-XXXX e permite buscar por ele", async () => {
    const request = await seedValidatedRequest(db);
    expect(request.shortCode).toMatch(/^RS-[A-Z0-9]{4}$/);

    const byCode = await getRequest(request.shortCode as string, { db });
    expect(byCode?.id).toBe(request.id);
  });

  it("não reaproveita código entre pedidos distintos", async () => {
    const first = await seedValidatedRequest(db);
    const second = await seedValidatedRequest(db);
    expect(first.shortCode).not.toBe(second.shortCode);
  });
});
