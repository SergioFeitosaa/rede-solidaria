import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type Database } from "@/lib/db";
import { createRequest, reviewRequest, updateRequestStatus, listRequests } from "@/modules/requests/service";
import { createOffer, listOffers } from "@/modules/offers/service";
import { resolveActor, suggestionsForRequest } from "@/modules/matching/service";
import type { ClassifyFn } from "@/modules/ai/classify";

/**
 * Autorização do Match: quem age é decidido no servidor.
 * O cliente declara "sou o doador", mas só é aceito se a sessão anônima for
 * dona de um dos lados (ou se o registro for antigo/de demonstração).
 */

const noAi: ClassifyFn = async () => ({ status: "UNAVAILABLE", reason: "teste automatizado (IA mockada)." });

async function makeRequest(db: Database, ownerSession: string | null, region = "Ibura") {
  const { request } = await createRequest(
    {
      name: "Família Costa (DEMONSTRAÇÃO — fictício)",
      region,
      category: "Água",
      item: "galão de água",
      quantity: 2,
      description: "Ficamos sem água potável depois da enchente na nossa rua.",
      contactMethod: "retornar pela Central"
    },
    { db, classify: noAi, ownerSession }
  );
  await reviewRequest(request.id, { categoria: "Água", item: "galão de água", quantity: 2 }, { db });
  await updateRequestStatus(request.id, "VALIDATED", { db });
  return request;
}

async function makeOffer(db: Database, ownerSession: string | null) {
  return createOffer(
    {
      name: "Doadora Cláudia (DEMONSTRAÇÃO — fictício)",
      type: "DONATION",
      category: "Água",
      item: "galão de água",
      quantity: 6,
      region: "Ibura",
      availability: "imediata",
      description: "Tenho galões de água potável para doar nesta semana."
    },
    { db, ownerSession }
  );
}

describe("Match — autorização do ator", () => {
  let db: Database;

  beforeEach(async () => {
    db = await createTestDb();
  });

  it("quem é dono do pedido é 'requester', mesmo que o cliente diga 'provider'", async () => {
    const session = "sessao-do-morador-123456";
    const request = await makeRequest(db, session);
    const offer = await makeOffer(db, "sessao-do-doador-abcdef");

    const who = await resolveActor(
      { requestId: request.id, offerId: offer.id, declaredWho: "provider", session },
      { db }
    );
    expect(who).toBe("requester");
  });

  it("quem é dono da oferta é 'provider', mesmo que o cliente diga 'requester'", async () => {
    const session = "sessao-do-doador-abcdef";
    const request = await makeRequest(db, "sessao-do-morador-123456");
    const offer = await makeOffer(db, session);

    const who = await resolveActor(
      { requestId: request.id, offerId: offer.id, declaredWho: "requester", session },
      { db }
    );
    expect(who).toBe("provider");
  });

  it("bloqueia quem não é dono de nenhum dos lados (sem consentimento alheio)", async () => {
    const request = await makeRequest(db, "sessao-do-morador-123456");
    const offer = await makeOffer(db, "sessao-do-doador-abcdef");

    await expect(
      resolveActor(
        { requestId: request.id, offerId: offer.id, declaredWho: "provider", session: "sessao-intrusa-999999" },
        { db }
      )
    ).rejects.toThrow(/seus próprios registros/i);
  });

  it("registros de demonstração (sem dono) continuam aceitando a declaração do cliente", async () => {
    const request = await makeRequest(db, null);
    const offer = await makeOffer(db, null);

    const who = await resolveActor(
      { requestId: request.id, offerId: offer.id, declaredWho: "requester", session: null },
      { db }
    );
    expect(who).toBe("requester");
  });

  it("quem não tem sessão não age sobre registros que têm dono", async () => {
    const request = await makeRequest(db, "sessao-do-morador-123456");
    const offer = await makeOffer(db, "sessao-do-doador-abcdef");

    await expect(
      resolveActor({ requestId: request.id, offerId: offer.id, declaredWho: "requester", session: null }, { db })
    ).rejects.toThrow();
  });
});

describe("Match — visualizar não grava nada", () => {
  let db: Database;

  beforeEach(async () => {
    db = await createTestDb();
  });

  it("consultar sugestões não cria linhas em matches", async () => {
    const request = await makeRequest(db, null);
    await makeOffer(db, null);

    const suggestions = await suggestionsForRequest(request.id, { db });
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]?.matchId).toBeNull();

    const rows = await db.query<{ total: number }>("SELECT COUNT(*)::int AS total FROM matches");
    expect(rows[0]?.total).toBe(0);
  });
});

describe("Paginação das listagens", () => {
  let db: Database;

  beforeEach(async () => {
    db = await createTestDb();
  });

  it("respeita limit e offset em pedidos", async () => {
    await makeRequest(db, null, "Ibura");
    await makeRequest(db, null, "Boa Viagem");
    await makeRequest(db, null, "Casa Amarela");

    const firstPage = await listRequests({ limit: 2, offset: 0 }, { db });
    const secondPage = await listRequests({ limit: 2, offset: 2 }, { db });

    expect(firstPage).toHaveLength(2);
    expect(secondPage).toHaveLength(1);
    const ids = new Set([...firstPage, ...secondPage].map((request) => request.id));
    expect(ids.size).toBe(3);
  });

  it("respeita limit em ofertas", async () => {
    await makeOffer(db, null);
    await makeOffer(db, null);

    const offers = await listOffers({ limit: 1 }, { db });
    expect(offers).toHaveLength(1);
  });
});
