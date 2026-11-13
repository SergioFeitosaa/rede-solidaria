import { updateAttendance } from "@/modules/mobilization/service";
import { toResponse, DomainError } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/attendances/:id — atualizar atendimento.
 * Body: { status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED" }
 */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const denied = requireAdmin(req);
    if (denied) return denied;

    const { id } = await params;
    const body = await req.json();
    const status = body?.status;
    if (!["IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(status)) {
      throw new DomainError("Status inválido para atendimento.", 400);
    }
    const attendance = await updateAttendance(id, status);
    return Response.json({ attendance });
  } catch (err) {
    return toResponse(err);
  }
}
