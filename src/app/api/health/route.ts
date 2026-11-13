import { getDb } from "@/lib/db";
import { isAdminConfigured } from "@/lib/auth";

/** GET /api/health — diagnóstico sem segredos. */
export async function GET() {
  let db: "ok" | "erro" = "erro";
  let backend = process.env.DATABASE_URL ? "postgresql" : "pglite";
  try {
    const conn = await getDb();
    await conn.query("SELECT 1");
    db = "ok";
  } catch {
    db = "erro";
  }
  return Response.json({
    status: db === "ok" ? "ok" : "degradado",
    banco: { backend, estado: db },
    ia: {
      configurada: Boolean(process.env.OPENAI_API_KEY),
      modelo: process.env.OPENAI_MODEL ?? "gpt-4o-mini"
    },
    central: { adminConfigurado: isAdminConfigured() }
  });
}
