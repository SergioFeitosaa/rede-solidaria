import { createRequest, listRequests } from "@/modules/requests/service";
import { toResponse } from "@/lib/errors";
import { isAdminRequest } from "@/lib/auth";

/** POST /api/requests — cadastrar necessidade (Módulo A). */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await createRequest(body);
    return Response.json(result, { status: 201 });
  } catch (err) {
    return toResponse(err);
  }
}

/** GET /api/requests — consultar necessidades (sem dados de contato para o público). */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const list = await listRequests({
      status: url.searchParams.get("status") ?? undefined,
      region: url.searchParams.get("region") ?? undefined
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
