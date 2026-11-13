import { describe, expect, it } from "vitest";
import { evaluateCompatibility } from "@/modules/matching/engine";

/**
 * Teste 2 do edital — Compatibilidade:
 * o motor identifica oferta compatível e rejeita incompatível.
 */
describe("motor de matching (regras objetivas)", () => {
  const request = {
    category: "Colchões",
    item: "colchão",
    quantity: 2,
    region: "Casa Amarela"
  };

  it("aceita oferta compatível (2 colchões para 2 colchões, mesma categoria)", () => {
    const offer = { category: "Colchões", item: "colchões", quantity: 2, region: "Casa Amarela" };
    const report = evaluateCompatibility(request, offer);
    expect(report.compatible).toBe(true);
    expect(report.score).toBeGreaterThanOrEqual(85);
    expect(report.reason).toContain("compatível");
    expect(report.reason).toContain("colch");
  });

  it("rejeita oferta com quantidade insuficiente (1 colchão para 2)", () => {
    const offer = { category: "Colchões", item: "colchão", quantity: 1, region: "Casa Amarela" };
    const report = evaluateCompatibility(request, offer);
    expect(report.compatible).toBe(false);
    expect(report.reason).toContain("Incompatível");
    expect(report.reason).toContain("quantidade");
  });

  it("rejeita oferta de categoria diferente (água × colchões)", () => {
    const offer = { category: "Água", item: "galão de água", quantity: 10, region: "Casa Amarela" };
    const report = evaluateCompatibility(request, offer);
    expect(report.compatible).toBe(false);
    expect(report.reason).toContain("categorias diferentes");
  });

  it("rejeita quando os itens não combinam dentro da mesma categoria", () => {
    const req = { category: "Roupas", item: "agasalho", quantity: 1, region: "Boa Viagem" };
    const offer = { category: "Roupas", item: "sapato", quantity: 5, region: "Boa Viagem" };
    const report = evaluateCompatibility(req, offer);
    expect(report.compatible).toBe(false);
    expect(report.reason).toContain("itens diferentes");
  });

  it("aceita item genérico quando a categoria e a quantidade batem", () => {
    const req = { category: "Alimentos", item: null, quantity: null, region: "Ibura" };
    const offer = { category: "Alimentos", item: "cesta básica", quantity: 3, region: "Ibura" };
    const report = evaluateCompatibility(req, offer);
    expect(report.compatible).toBe(true);
    expect(report.reason).toContain("categoria");
  });

  it("não depende de acento/caixa para comparar regiões", () => {
    const req = { category: "Água", item: "água", quantity: 5, region: "casa amarela" };
    const offer = { category: "Água", item: "galão de água", quantity: 6, region: "Casa Amarela" };
    const report = evaluateCompatibility(req, offer);
    expect(report.compatible).toBe(true);
    expect(report.reason).toContain("Região aproximada");
  });
});
