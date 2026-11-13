import {
  listMatches,
  registerInterest,
  suggestionsForOffer,
  suggestionsForRequest
} from "@/modules/matching/service";
import { toResponse, DomainError } from "@/lib/errors";

/**
 * GET /api/matches
 * - ?requestId= → recomendações de ofertas para um pedido.
 * - ?offerId=   → recomendações de pedidos para uma oferta.
 * - ?status=    → matches já registrados (para a Central).
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const requestId = url.searchParams.get("requestId");
    const offerId = url.searchParams.get("offerId");

    if (requestId) {
      const suggestions = await suggestionsForRequest(requestId);
      return Response.json({ suggestions });
    }
    if (offerId) {
      const suggestions = await suggestionsForOffer(offerId);
      return Response.json({ suggestions });
    }
    const matches = await listMatches({ status: url.searchParams.get("status") ?? undefined });
    return Response.json({ matches });
  } catch (err) {
    return toResponse(err);
  }
}

/** POST /api/matches — registrar interesse (Swipe à direita / botão). */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const who = body.who === "provider" ? "provider" : body.who === "requester" ? "requester" : null;
    if (!who || !body.requestId || !body.offerId) {
      throw new DomainError("Informe requestId, offerId e who ('requester' ou 'provider').", 400);
    }
    const result = await registerInterest({
      requestId: String(body.requestId),
      offerId: String(body.offerId),
      who
    });
    return Response.json(result, { status: 201 });
  } catch (err) {
    return toResponse(err);
  }
}
