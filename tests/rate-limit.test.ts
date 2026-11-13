import { describe, expect, it } from "vitest";
import { createRateLimiter } from "@/lib/rate-limit";

/**
 * Limite de escrita nas rotas públicas: um script não pode criar
 * centenas de pedidos em segundos durante a demonstração.
 */

describe("Rate limit em memória", () => {
  it("libera até o limite e bloqueia depois", () => {
    const check = createRateLimiter({ limit: 3, windowMs: 60_000, now: () => 1_000 });

    expect(check("ip-1").ok).toBe(true);
    expect(check("ip-1").ok).toBe(true);
    expect(check("ip-1").ok).toBe(true);
    const blocked = check("ip-1");
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("cada chave tem a própria cota", () => {
    const check = createRateLimiter({ limit: 2, windowMs: 60_000, now: () => 1_000 });

    check("ip-a");
    check("ip-a");
    expect(check("ip-a").ok).toBe(false);
    expect(check("ip-b").ok).toBe(true);
  });

  it("libera de novo quando a janela expira", () => {
    let clock = 0;
    const check = createRateLimiter({ limit: 1, windowMs: 1_000, now: () => clock });

    expect(check("ip").ok).toBe(true);
    expect(check("ip").ok).toBe(false);
    clock = 1_500;
    expect(check("ip").ok).toBe(true);
  });
});
