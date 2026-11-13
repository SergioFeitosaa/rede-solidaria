import { getDashboard } from "@/modules/mobilization/service";
import { toResponse } from "@/lib/errors";

/** GET /api/dashboard — indicadores da Central (calculados do banco). */
export async function GET() {
  try {
    const dashboard = await getDashboard();
    return Response.json({ dashboard });
  } catch (err) {
    return toResponse(err);
  }
}
