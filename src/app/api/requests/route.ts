import { createRequest, listRequests, pageParams } from "@/modules/requests/service";
import { toResponse } from "@/lib/errors";
import { isAdminRequest } from "@/lib/auth";
import { ensureOwnerSession } from "@/lib/session";
import { clientKey, tooManyRequests, writeLimiter } from "@/lib/rate-limit";

/** POST /api/requests — cadastrar necessidade (Módulo A). */
export async function POST(req: Request) {
  try {
    const limit = writeLimiter(clientKey(req));
    if (!limit.ok) return tooManyRequests(limit);

    const body = await req.json();
    // Sessão anônima: prova de quem é o pedido, sem exigir cadastro.
    const ownerSession = await ensureOwnerSession();
    const result = await createRequest(body, { ownerSession });
    return Response.json(result, { status: 201 });
  } catch (err) {
    return toResponse(err);
  }
}

/** GET /api/requests — consultar necessidades (sem dados de contato para o público). */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    // Página padrão de 200 (fila da Central), ajustável por ?limit=&offset=.
    const { limit, offset } = pageParams(
      { limit: url.searchParams.get("limit"), offset: url.searchParams.get("offset") },
      200
    );
    const list = await listRequests({
      status: url.searchParams.get("status") ?? undefined,
      region: url.searchParams.get("region") ?? undefined,
      limit,
      offset
    });
    const isAdmin = isAdminRequest(req);
    const safe = list.map(({ contactMethod, ...rest }) =>
      isAdmin ? { ...rest, contactMethod } : rest
    );
    return Response.json({ requests: safe });
  } catch (err) {
    return toResponse(err);
  }
}
