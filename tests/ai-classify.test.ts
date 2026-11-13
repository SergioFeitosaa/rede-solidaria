import { describe, expect, it } from "vitest";
import { interpretNeed, makeInterpretNeed } from "@/modules/ai/classify";

/** IA mockada: nenhuma chamada externa real nos testes (regra do edital). */
function fakeFetch(response: unknown, status = 200): typeof fetch {
  return (async () =>
    new Response(JSON.stringify(response), {
      status,
      headers: { "content-type": "application/json" }
    })) as typeof fetch;
}

const VALID_AI_JSON = {
  choices: [
    {
      message: {
        content: JSON.stringify({
          categoria: "Colchões",
          item: "colchão",
          quantidade: 2,
          contexto: "perda associada a alagamento",
          precisa_revisao: false
        })
      }
    }
  ]
};

describe("interpretação de necessidades (IA — Função 1)", () => {
  it("interpreta uma descrição real e devolve saída estruturada validada", async () => {
    const result = await interpretNeed(
      { description: "Minha casa alagou e perdi dois colchões. Preciso de ajuda.", region: "Recife" },
      { fetchImpl: fakeFetch(VALID_AI_JSON), apiKey: "test-key", baseUrl: "https://ia.teste/v1" }
    );
    expect(result.status).toBe("OK");
    if (result.status === "OK") {
      expect(result.interpretation.categoria).toBe("Colchões");
      expect(result.interpretation.item).toBe("colchão");
      expect(result.interpretation.quantidade).toBe(2);
      expect(result.interpretation.contexto).toContain("alagamento");
    }
  });

  it("retorna UNAVAILABLE quando não há chave de IA configurada (sem simular resultado)", async () => {
    const result = await interpretNeed(
      { description: "qualquer texto" },
      { fetchImpl: fakeFetch(VALID_AI_JSON), apiKey: undefined }
    );
    expect(result.status).toBe("UNAVAILABLE");
    if (result.status === "UNAVAILABLE") {
      expect(result.reason).toContain("OPENAI_API_KEY");
    }
  });

  it("retorna UNAVAILABLE quando a resposta não é JSON válido", async () => {
    const broken = (async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: "não sou json" } }] }), {
        status: 200
      })) as typeof fetch;
    const result = await interpretNeed(
      { description: "texto" },
      { fetchImpl: broken, apiKey: "k" }
    );
    expect(result.status).toBe("UNAVAILABLE");
    if (result.status === "UNAVAILABLE") {
      expect(result.reason).toContain("JSON");
    }
  });

  it("retorna UNAVAILABLE quando a resposta não passa na validação do esquema", async () => {
    const wrongShape = {
      choices: [{ message: { content: JSON.stringify({ categoria: "Categoria Inexistente" }) } }]
    };
    const result = await interpretNeed(
      { description: "texto" },
      { fetchImpl: fakeFetch(wrongShape), apiKey: "k" }
    );
    expect(result.status).toBe("UNAVAILABLE");
    if (result.status === "UNAVAILABLE") {
      expect(result.reason).toContain("esquema");
    }
  });

  it("retorna UNAVAILABLE quando a API responde erro HTTP", async () => {
    const result = await interpretNeed(
      { description: "texto" },
      { fetchImpl: fakeFetch({ error: "quota" }, 429), apiKey: "k" }
    );
    expect(result.status).toBe("UNAVAILABLE");
    if (result.status === "UNAVAILABLE") {
      expect(result.reason).toContain("429");
    }
  });

  it("makeInterpretNeed injeta as opções (usado nos testes de serviço)", async () => {
    const classify = makeInterpretNeed({
      fetchImpl: fakeFetch(VALID_AI_JSON),
      apiKey: "k",
      baseUrl: "https://ia.teste/v1",
      model: "modelo-teste"
    });
    const result = await classify({ description: "preciso de colchões" });
    expect(result.status).toBe("OK");
  });
});
