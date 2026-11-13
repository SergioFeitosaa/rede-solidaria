import { getDb, newId, type Database } from "@/lib/db";
import { DomainError } from "@/lib/errors";
import { recognizeRegion, type RecognizeOptions } from "@/lib/regions";
import { CATEGORIAS } from "@/modules/ai/schema";
import { z } from "zod";

/** Módulo B — Oferecer ajuda (doação ou voluntariado). */

export const createOfferSchema = z.object({
  name: z.string().trim().min(2, "Informe um nome ou identificação de demonstração.").max(80),
  type: z.enum(["DONATION", "VOLUNTEERING"], {
    errorMap: () => ({ message: "Escolha doação ou voluntariado." })
  }),
  category: z.enum(CATEGORIAS, { errorMap: () => ({ message: "Escolha uma categoria." }) }),
  item: z.string().trim().max(120).optional().nullable(),
  quantity: z.coerce.number().int().positive().max(100000).optional().nullable(),
  region: z.string().trim().min(2, "Informe a região aproximada.").max(80),
  availability: z.string().trim().max(120).optional().nullable(),
  description: z.string().trim().min(10, "Descreva a oferta em pelo menos 10 caracteres.").max(2000)
});

export interface OfferRecord {
  id: string;
  userId: string | null;
  type: "DONATION" | "VOLUNTEERING";
  category: string;
  item: string | null;
  description: string;
  quantity: number | null;
  region: string;
  availability: string | null;
  status: "AVAILABLE" | "RESERVED" | "UNAVAILABLE";
  createdAt: string;
}

interface OfferRow {
  id: string;
  user_id: string | null;
  type: OfferRecord["type"];
  category: string;
  item: string | null;
  description: string;
  quantity: number | null;
  region: string;
  availability: string | null;
  status: OfferRecord["status"];
  created_at: string | Date;
}

function toRecord(row: OfferRow): OfferRecord {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    category: row.category,
    item: row.item,
    description: row.description,
    quantity: row.quantity,
    region: row.region,
    availability: row.availability,
    status: row.status,
    createdAt: String(row.created_at)
  };
}

export interface OfferDeps {
  db?: Database;
  region?: (input: string, opts?: RecognizeOptions) => Promise<Awaited<ReturnType<typeof recognizeRegion>>>;
}

export async function createOffer(
  input: z.infer<typeof createOfferSchema>,
  deps: OfferDeps = {}
): Promise<OfferRecord> {
  const parsed = createOfferSchema.safeParse(input);
  if (!parsed.success) {
    throw new DomainError(parsed.error.errors.map((e) => e.message).join(" "), 422);
  }
  const data = parsed.data;
  const db = deps.db ?? (await getDb());
  const recognize = deps.region ?? recognizeRegion;
  const recognition = await recognize(data.region, { offline: true });
  const region = recognition.canonical ?? data.region;

  const [user] = await db.query<{ id: string }>(
    "INSERT INTO users (id, name, role, region) VALUES ($1, $2, 'DONOR', $3) RETURNING id",
    [newId(), data.name, region]
  );

  const [row] = await db.query<OfferRow>(
    `INSERT INTO help_offers
       (id, user_id, type, category, item, description, quantity, region, availability, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'AVAILABLE')
     RETURNING *`,
    [
      newId(),
      user.id,
      data.type,
      data.category,
      data.item ?? null,
      data.description,
      data.quantity ?? null,
      region,
      data.availability ?? null
    ]
  );
  return toRecord(row);
}

export async function getOffer(id: string, deps: OfferDeps = {}): Promise<OfferRecord | null> {
  const db = deps.db ?? (await getDb());
  const [row] = await db.query<OfferRow>("SELECT * FROM help_offers WHERE id = $1", [id]);
  return row ? toRecord(row) : null;
}

export async function listOffers(
  filters: { status?: string; category?: string } = {},
  deps: OfferDeps = {}
): Promise<OfferRecord[]> {
  const db = deps.db ?? (await getDb());
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (filters.status) {
    params.push(filters.status);
    conditions.push(`status = $${params.length}`);
  }
  if (filters.category) {
    params.push(filters.category);
    conditions.push(`category = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await db.query<OfferRow>(
    `SELECT * FROM help_offers ${where} ORDER BY created_at DESC LIMIT 200`,
    params as never
  );
  return rows.map(toRecord);
}

export async function setOfferStatus(
  id: string,
  status: OfferRecord["status"],
  deps: OfferDeps = {}
): Promise<OfferRecord> {
  const db = deps.db ?? (await getDb());
  const [updated] = await db.query<OfferRow>(
    "UPDATE help_offers SET status = $2 WHERE id = $1 RETURNING *",
    [id, status]
  );
  if (!updated) throw new DomainError("Oferta não encontrada.", 404);
  return toRecord(updated);
}
