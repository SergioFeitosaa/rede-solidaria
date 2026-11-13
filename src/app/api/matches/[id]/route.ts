import { updateMatchByOrg } from "@/modules/matching/service";
import { toResponse, DomainError } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/matches/:id — ações da organização.
 * Body: { action: "CONFIRM" | "REJECT" }
 * CONFIRM cria o atendimento (PENDING) e reserva a oferta.
 */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const denied = requireAdmin(req);
    if (denied) return denied;

    const { id } = await params;
    const body = await req.json();
    const action = body?.action === "REJECT" ? "REJECT" : body?.action === "CONFIRM" ? "CONFIRM" : null;
    if (!action) throw new DomainError("Ação inválida. Use CONFIRM ou REJECT.", 400);

    const result = await updateMatchByOrg(id, action, "Central de Mobilização");
    return Response.json(result);
  } catch (err) {
    return toResponse(err);
  }
}
