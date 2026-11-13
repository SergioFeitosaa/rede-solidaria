import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type Database } from "@/lib/db";
import {
  createRequest,
  reviewRequest,
  updateRequestStatus
} from "@/modules/requests/service";
import type { ClassifyFn } from "@/modules/ai/classify";

/**
 * Teste 1 do edital — Classificação:
 * uma necessidade estruturada é validada e armazenada corretamente,
 * com auditoria humana da classificação sugerida pela IA.
 */

const aiSuggestsMattress: ClassifyFn = async () => ({
  status: "OK",
  interpretation: {
    categoria: "Colchões",
    item: "colchão",
    quantidade: 2,
    contexto: "perda associada a alagamento",
    precisa_revisao: false
  },
  provider: "https://ia.teste/v1",
  model: "modelo-teste"
});

const aiUnavailable: ClassifyFn = async () => ({
  status: "UNAVAILABLE",
  reason: "Chave de IA não configurada (variável OPENAI_API_KEY). Análise automática indisponível."
});

const baseInput = {
  name: "Família Souza (DEMONSTRAÇÃO — fictício)",
  region: "Casa Amarela",
  category: "Colchões" as const,
  item: "colchão",
  quantity: 2,
  description: "Perdemos nossos colchões no alagamento. Precisamos de dois colchões.",
  contactMethod: "retornar pela Central"
};

describe("Módulo A — pedido de ajuda com classificação auditável", () => {
  let db: Database;

  beforeEach(async () => {
    db = await createTestDb();
  });

  it("valida, classifica pela IA e persiste o pedido corretamente", async () => {
    const { request, classification } = await createRequest(baseInput, {
      db,
      classify: aiSuggestsMattress
    });

    expect(request.id).toBeTruthy();
    expect(request.status).toBe("PENDING");
    expect(request.category).toBe("Colchões");
    expect(request.quantity).toBe(2);
    expect(request.region).toBe("Casa Amarela");

    // auditoria: sugestão da IA registrada, ainda sem revisão
    expect(classification.status).toBe("SUGGESTED");
    expect(classification.original?.item).toBe("colchão");
    expect(classification.final).toBeNull();

    // persistido no banco (não apenas em memória da requisição)
    const rows = await db.query("SELECT * FROM help_requests WHERE id = $1", [request.id]);
    expect(rows).toHaveLength(1);
    expect(rows[0].description).toContain("alagamento");
  });

  it("rejeita entrada inválida antes de qualquer persistência", async () => {
    await expect(
      createRequest({ ...baseInput, description: "curta" }, { db, classify: aiSuggestsMattress })
    ).rejects.toThrow(/10 caracteres/);
    const rows = await db.query("SELECT * FROM help_requests");
    expect(rows).toHaveLength(0);
  });

  it("registra confirmação humana (ACCEPTED) sem correções", async () => {
    const { request } = await createRequest(baseInput, { db, classify: aiSuggestsMattress });
    const reviewed = await reviewRequest(
      request.id,
      { categoria: "Colchões", item: "colchão", quantity: 2 },
      { db }
    );
    expect(reviewed.aiClassification?.status).toBe("ACCEPTED");
    expect(reviewed.reviewedAt).toBeTruthy();
    expect(Object.keys(reviewed.aiClassification?.corrections ?? {})).toHaveLength(0);
  });

  it("registra correção humana (CORRECTED) com diff original × corrigido", async () => {
    const { request } = await createRequest(baseInput, { db, classify: aiSuggestsMattress });
    const reviewed = await reviewRequest(
      request.id,
      { categoria: "Colchões", item: "colchão casal", quantity: 3 },
      { db }
    );
    expect(reviewed.aiClassification?.status).toBe("CORRECTED");
    expect(reviewed.aiClassification?.corrections.item?.para).toBe("colchão casal");
    expect(reviewed.aiClassification?.corrections.quantidade?.para).toBe(3);
    // valores finais aplicados ao pedido
    expect(reviewed.item).toBe("colchão casal");
    expect(reviewed.quantity).toBe(3);
  });

  it("sem IA: preserva o pedido e marca classificação MANUAL (nunca finge ser IA)", async () => {
    const { request, classification } = await createRequest(baseInput, { db, classify: aiUnavailable });
    expect(classification.status).toBe("UNAVAILABLE");
    expect(request.status).toBe("PENDING"); // pedido preservado

    const reviewed = await reviewRequest(
      request.id,
      { categoria: "Colchões", item: "colchão", quantity: 2 },
      { db }
    );
    expect(reviewed.aiClassification?.status).toBe("MANUAL");
    expect(reviewed.aiClassification?.reason).toContain("OPENAI_API_KEY");
  });

  it("só a organização valida: PENDING → VALIDATED, com transições controladas", async () => {
    const { request } = await createRequest(baseInput, { db, classify: aiSuggestsMattress });
    await reviewRequest(request.id, { categoria: "Colchões", item: "colchão", quantity: 2 }, { db });

    const validated = await updateRequestStatus(request.id, "VALIDATED", { db });
    expect(validated.status).toBe("VALIDATED");

    // transição inválida é bloqueada
    await expect(updateRequestStatus(request.id, "VALIDATED", { db })).rejects.toThrow(/Transição inválida/);
  });
});
