import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type Database } from "@/lib/db";
import { createRequest, reviewRequest, updateRequestStatus, getRequest } from "@/modules/requests/service";
import { createOffer, getOffer } from "@/modules/offers/service";
import { registerInterest, updateMatchByOrg, suggestionsForRequest } from "@/modules/matching/service";
import { updateAttendance, getAttendance, getDashboard } from "@/modules/mobilization/service";
import type { ClassifyFn } from "@/modules/ai/classify";

/**
 * Teste 3 do edital — Fluxo de atendimento:
 * interesse → confirmação → conclusão, respeitando as regras de negócio
 * (sem confirmação duplicada de oferta comprometida, sem pular etapas).
 */

const noAi: ClassifyFn = async () => ({ status: "UNAVAILABLE", reason: "teste automatizado (IA mockada)." });

async function seedValidatedRequest(db: Database, quantity = 2) {
  const { request } = await createRequest(
    {
      name: "Família Lima (DEMONSTRAÇÃO — fictício)",
      region: "Ibura",
      category: "Colchões",
      item: "colchão",
      quantity,
      description: "Perdemos nossos colchões no alagamento da última chuva forte.",
      contactMethod: "retornar pela Central"
    },
    { db, classify: noAi }
  );
  await reviewRequest(request.id, { categoria: "Colchões", item: "colchão", quantity }, { db });
  await updateRequestStatus(request.id, "VALIDATED", { db });
  return request;
}

async function seedOffer(db: Database, quantity = 2) {
  return createOffer(
    {
      name: "Doador Marcos (DEMONSTRAÇÃO — fictício)",
      type: "DONATION",
      category: "Colchões",
      item: "colchão",
      quantity,
      region: "Ibura",
      availability: "fins de semana",
      description: "Tenho colchões em bom estado para doar após as enchentes."
    },
    { db }
  );
}

describe("fluxo de atendimento de ponta a ponta", () => {
  let db: Database;

  beforeEach(async () => {
    db = await createTestDb();
  });

  it("caminho feliz: interesse mútuo → confirmação → atendimento concluído → pedido FULFILLED", async () => {
    const request = await seedValidatedRequest(db);
    const offer = await seedOffer(db);

    // recomendação compatível (explicável)
    const suggestions = await suggestionsForRequest(request.id, { db });
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].report.reason).toContain("compatível");

    // Swipe: interesses dos dois lados
    const first = await registerInterest({ requestId: request.id, offerId: offer.id, who: "requester" }, { db });
    expect(first.match.status).toBe("INTERESTED");
    expect(first.mutualInterest).toBe(false);

    const second = await registerInterest({ requestId: request.id, offerId: offer.id, who: "provider" }, { db });
    expect(second.mutualInterest).toBe(true);
    expect(second.match.status).toBe("PENDING_CONFIRMATION");

    // Organização confirma → atendimento criado e oferta reservada
    const confirmed = await updateMatchByOrg(second.match.id, "CONFIRM", "Central (teste)", { db });
    expect(confirmed.match.status).toBe("CONFIRMED");
    expect(confirmed.attendanceId).toBeTruthy();

    const offerAfter = await getOffer(offer.id, { db });
    expect(offerAfter?.status).toBe("RESERVED");

    // Atendimento segue a máquina de estados
    const attendance = await getAttendance(confirmed.attendanceId!, { db });
    expect(attendance?.status).toBe("PENDING");

    await updateAttendance(confirmed.attendanceId!, "IN_PROGRESS", { db });
    const completed = await updateAttendance(confirmed.attendanceId!, "COMPLETED", { db });
    expect(completed.status).toBe("COMPLETED");
    expect(completed.completedAt).toBeTruthy();

    // conclusão reflete no pedido e nos indicadores
    const requestAfter = await getRequest(request.id, { db });
    expect(requestAfter?.status).toBe("FULFILLED");

    const dashboard = await getDashboard({ db });
    expect(dashboard.atendimentosConcluidos).toBe(1);
    expect(dashboard.indicadorPrincipal.percentual).toBeGreaterThan(0);
  });

  it("impede confirmação duplicada de uma oferta já comprometida", async () => {
    const requestA = await seedValidatedRequest(db);
    const requestB = await seedValidatedRequest(db);
    const offer = await seedOffer(db);

    const a = await registerInterest({ requestId: requestA.id, offerId: offer.id, who: "requester" }, { db });
    const b = await registerInterest({ requestId: requestB.id, offerId: offer.id, who: "provider" }, { db });

    await updateMatchByOrg(a.match.id, "CONFIRM", "Central (teste)", { db });
    await expect(updateMatchByOrg(b.match.id, "CONFIRM", "Central (teste)", { db })).rejects.toThrow(
      /comprometida|duplicada/i
    );
  });

  it("bloqueia pulo de etapas e transições inválidas de atendimento", async () => {
    const request = await seedValidatedRequest(db);
    const offer = await seedOffer(db);
    const interest = await registerInterest({ requestId: request.id, offerId: offer.id, who: "requester" }, { db });
    const { attendanceId } = await updateMatchByOrg(interest.match.id, "CONFIRM", "Central (teste)", { db });

    // PENDING → COMPLETED direto não pode
    await expect(updateAttendance(attendanceId!, "COMPLETED", { db })).rejects.toThrow(/Transição inválida/);

    await updateAttendance(attendanceId!, "IN_PROGRESS", { db });
    await updateAttendance(attendanceId!, "COMPLETED", { db });
    // COMPLETED é terminal
    await expect(updateAttendance(attendanceId!, "IN_PROGRESS", { db })).rejects.toThrow(/Transição inválida/);
  });

  it("cancelar atendimento devolve a oferta ao pool de disponíveis", async () => {
    const request = await seedValidatedRequest(db);
    const offer = await seedOffer(db);
    const interest = await registerInterest({ requestId: request.id, offerId: offer.id, who: "requester" }, { db });
    const { attendanceId } = await updateMatchByOrg(interest.match.id, "CONFIRM", "Central (teste)", { db });

    await updateAttendance(attendanceId!, "CANCELLED", { db });
    const offerAfter = await getOffer(offer.id, { db });
    expect(offerAfter?.status).toBe("AVAILABLE");
  });

  it("pedidos não validados ficam fora do matching operacional", async () => {
    const { request } = await createRequest(
      {
        name: "Teste (DEMONSTRAÇÃO — fictício)",
        region: "Boa Viagem",
        category: "Água",
        item: "galão",
        quantity: 2,
        description: "Precisamos de água potável em galões.",
        contactMethod: null
      },
      { db, classify: noAi }
    );
    const offer = await seedOffer(db);
    await expect(
      registerInterest({ requestId: request.id, offerId: offer.id, who: "provider" }, { db })
    ).rejects.toThrow(/validados pela organização/);
  });
});
