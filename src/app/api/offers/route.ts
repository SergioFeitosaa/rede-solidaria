import { createOffer, listOffers } from "@/modules/offers/service";
import { toResponse } from "@/lib/errors";

/** POST /api/offers — cadastrar oferta (Módulo B). */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const offer = await createOffer(body);
    return Response.json({ offer }, { status: 201 });
  } catch (err) {
    return toResponse(err);
  }
}

/** GET /api/offers — consultar ofertas. */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const offers = await listOffers({
      status: url.searchParams.get("status") ?? undefined,
      category: url.searchParams.get("category") ?? undefined
    });
    return Response.json({ offers });
  } catch (err) {
    return toResponse(err);
  }
}
