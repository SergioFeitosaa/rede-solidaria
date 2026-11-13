import {
  dismissSuggestion,
  listMatches,
  registerInterest,
  suggestionsForOffer,
  suggestionsForRequest
} from "@/modules/matching/service";
import { toResponse, DomainError } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth";

/**
 * GET /api/matches
 * - ?requestId= → recomendações de ofertas para um pedido (público).
 * - ?offerId=   → recomendações de pedidos para uma oferta (público).
 * - sem filtro  → matches registrados. Dado operacional: só para a Central.
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

    // Lista completa de conexões só com token administrativo.
    const denied = requireAdmin(req);
    if (denied) return denied;

    const matches = await listMatches({ status: url.searchParams.get("status") ?? undefined });
    return Response.json({ matches });
  } catch (err) {
    return toResponse(err);
  }
}

/**
 * POST /api/matches
 * - { requestId, offerId, who } → registra interesse (swipe à direita).
 * - { action: "PASS", requestId, offerId, who } → registra dispensa (swipe à esquerda),
 *   para o cartão não voltar na próxima visita.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const who = body.who === "provider" ? "provider" : body.who === "requester" ? "requester" : null;
    if (!who || !body.requestId || !body.offerId) {
      throw new DomainError("Informe requestId, offerId e who ('requester' ou 'provider').", 400);
    }

    if (body.action === "PASS") {
      await dismissSuggestion({ requestId: String(body.requestId), offerId: String(body.offerId), who });
      return Response.json({ dismissed: true });
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
