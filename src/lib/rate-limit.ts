/**
 * Limite de requisições em memória, para as rotas públicas de escrita.
 *
 * Serve para o que o MVP precisa: impedir que um script crie centenas de
 * pedidos em segundos durante a demonstração. É por instância — em produção
 * serverless (Vercel), troque por um contador compartilhado (Upstash/Redis).
 */

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** Segundos até liberar (usado no header Retry-After). */
  retryAfter: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

export function createRateLimiter(options: {
  limit: number;
  windowMs: number;
  now?: () => number;
  maxKeys?: number;
}) {
  const buckets = new Map<string, Bucket>();
  const now = options.now ?? (() => Date.now());
  const maxKeys = options.maxKeys ?? 5000;

  return function check(key: string): RateLimitResult {
    const current = now();
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= current) {
      buckets.set(key, { count: 1, resetAt: current + options.windowMs });
      // Poda simples: evita mapa crescendo sem limite em processo longo.
      if (buckets.size > maxKeys) {
        for (const [bucketKey, bucket] of buckets) {
          if (bucket.resetAt <= current) buckets.delete(bucketKey);
        }
      }
      return { ok: true, remaining: options.limit - 1, retryAfter: 0 };
    }

    if (existing.count >= options.limit) {
      return {
        ok: false,
        remaining: 0,
        retryAfter: Math.max(1, Math.ceil((existing.resetAt - current) / 1000))
      };
    }

    existing.count += 1;
    return { ok: true, remaining: options.limit - existing.count, retryAfter: 0 };
  };
}

/** Pedidos/ofertas: 12 criações por minuto por IP (folgado para uso humano). */
export const writeLimiter = createRateLimiter({ limit: 12, windowMs: 60_000 });

/** Interesses/dispensas do Match: mais frequentes, então limite maior. */
export const matchLimiter = createRateLimiter({ limit: 90, windowMs: 60_000 });

export function clientKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "anonimo";
}

export function tooManyRequests(result: RateLimitResult): Response {
  return Response.json(
    {
      error: "Muitas requisições em pouco tempo. Aguarde alguns segundos e tente de novo.",
      retryAfter: result.retryAfter
    },
    { status: 429, headers: { "Retry-After": String(result.retryAfter) } }
  );
}
