import { listAttendances } from "@/modules/mobilization/service";
import { toResponse } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth";

/** GET /api/attendances — listar atendimentos (Central, acesso restrito). */
export async function GET(req: Request) {
  try {
    const denied = requireAdmin(req);
    if (denied) return denied;
    const attendances = await listAttendances();
    return Response.json({ attendances });
  } catch (err) {
    return toResponse(err);
  }
}
