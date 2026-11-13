import { getRequest, reviewRequest, updateRequestStatus } from "@/modules/requests/service";
import { toResponse, DomainError } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

/** GET /api/requests/:id */
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const request = await getRequest(id);
    if (!request) throw new DomainError("Pedido não encontrado.", 404);
    return Response.json({ request });
  } catch (err) {
    return toResponse(err);
  }
}

/**
 * PATCH /api/requests/:id
 * - { review: { categoria, item, quantity } } → revisão humana da classificação.
 * - { status: "VALIDATED" | "REJECTED" | "FULFILLED" } → organização (admin).
 */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (body && typeof body === "object" && "review" in body) {
      const request = await reviewRequest(id, body.review ?? {});
      return Response.json({ request });
    }

    if (body && typeof body === "object" && "status" in body) {
      const denied = requireAdmin(req);
      if (denied) return denied;
      const request = await updateRequestStatus(id, body.status);
      return Response.json({ request });
    }

    throw new DomainError("Envie 'review' (revisão humana) ou 'status' (organização).", 400);
  } catch (err) {
    return toResponse(err);
  }
}
