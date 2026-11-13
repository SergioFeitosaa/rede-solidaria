import { verifyAdminToken, isAdminConfigured, ADMIN_COOKIE } from "@/lib/auth";
import { toResponse, DomainError } from "@/lib/errors";

/** POST /api/central/login — valida o token administrativo e grava cookie httpOnly. */
export async function POST(req: Request) {
  try {
    if (!isAdminConfigured()) {
      throw new DomainError(
        "ADMIN_TOKEN não configurado no servidor. Defina um token de pelo menos 16 caracteres.",
        503
      );
    }
    const body = await req.json();
    const token = typeof body?.token === "string" ? body.token.trim() : undefined;
    if (!verifyAdminToken(token)) {
      throw new DomainError("Token inválido.", 401);
    }
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "set-cookie": `${ADMIN_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${secure}`
      }
    });
  } catch (err) {
    return toResponse(err);
  }
}
