import { createOffer, listOffers } from "@/modules/offers/service";
import { pageParams } from "@/modules/requests/service";
import { ensureOwnerSession } from "@/lib/session";
import { clientKey, tooManyRequests, writeLimiter } from "@/lib/rate-limit";
import { toResponse } from "@/lib/errors";

/** POST /api/offers — cadastrar oferta (Módulo B). */
export async function POST(req: Request) {
  try {
    const limit = writeLimiter(clientKey(req));
    if (!limit.ok) return tooManyRequests(limit);

    const body = await req.json();
    // Sessão anônima: prova de quem é a oferta, sem exigir cadastro.
    const ownerSession = await ensureOwnerSession();
    const offer = await createOffer(body, { ownerSession });
    return Response.json({ offer }, { status: 201 });
  } catch (err) {
    return toResponse(err);
  }
}

/** GET /api/offers — consultar ofertas (paginado). */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const { limit, offset } = pageParams(
      { limit: url.searchParams.get("limit"), offset: url.searchParams.get("offset") },
      200
    );
    const offers = await listOffers({
      status: url.searchParams.get("status") ?? undefined,
      category: url.searchParams.get("category") ?? undefined,
      limit,
      offset
    });
    return Response.json({ offers });
  } catch (err) {
    return toResponse(err);
  }
}
