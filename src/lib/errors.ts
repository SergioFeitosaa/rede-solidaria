/** Erro de domínio com status HTTP sugerido. */
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly status: number = 422
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export function toResponse(err: unknown): Response {
  if (err instanceof DomainError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  console.error("[rede-solidaria] erro não tratado:", err);
  return Response.json({ error: "Erro interno. Tente novamente." }, { status: 500 });
}
