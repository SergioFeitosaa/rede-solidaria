/**
 * Proteção da Central de Mobilização.
 * As rotas administrativas validam o token NO SERVIDOR (cookie httpOnly ou
 * header Authorization). Não basta esconder botões no frontend.
 */
export const ADMIN_COOKIE = "rs_admin";

function readAdminToken(): string | null {
  const token = process.env.ADMIN_TOKEN;
  // Falha fechada: sem token configurado (ou curto demais), ninguém entra.
  if (!token || token.length < 16) return null;
  return token;
}

export function isAdminConfigured(): boolean {
  return readAdminToken() !== null;
}

export function isAdminRequest(req: Request): boolean {
  const expected = readAdminToken();
  if (!expected) return false;

  const auth = req.headers.get("authorization");
  if (auth && auth.startsWith("Bearer ") && auth.slice(7).trim() === expected) {
    return true;
  }

  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    for (const part of cookieHeader.split(";")) {
      const [key, ...rest] = part.trim().split("=");
      if (key === ADMIN_COOKIE && rest.join("=") === expected) {
        return true;
      }
    }
  }
  return false;
}

export function requireAdmin(req: Request): Response | null {
  if (isAdminRequest(req)) return null;
  return Response.json(
    {
      error: "Acesso restrito à Central de Mobilização.",
      hint: "Faça login na Central com o token administrativo."
    },
    { status: 401 }
  );
}

export function verifyAdminToken(candidate: string | undefined): boolean {
  const expected = readAdminToken();
  return Boolean(expected && candidate && candidate === expected);
}
