import { cookies } from "next/headers";

/**
 * Sessão anônima do navegador.
 *
 * O morador não cria conta para pedir ajuda, mas precisamos saber de quem é
 * cada registro para não aceitar ações em nome de outra pessoa. Um cookie
 * httpOnly com UUID resolve isso sem cadastro, sem senha e sem e-mail.
 *
 * O valor é opaco (não contém dado pessoal) e nunca é devolvido nas APIs.
 */

export const OWNER_COOKIE = "rs_owner";
const MAX_AGE = 60 * 60 * 24 * 180; // 180 dias

export async function readOwnerSession(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(OWNER_COOKIE)?.value;
  return value && value.length >= 16 ? value : null;
}

/** Lê a sessão ou cria uma nova (só em Route Handler / Server Action). */
export async function ensureOwnerSession(): Promise<string> {
  const store = await cookies();
  const existing = store.get(OWNER_COOKIE)?.value;
  if (existing && existing.length >= 16) return existing;

  const token = globalThis.crypto.randomUUID();
  store.set({
    name: OWNER_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === "production"
  });
  return token;
}
