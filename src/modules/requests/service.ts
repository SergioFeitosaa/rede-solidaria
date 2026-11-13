import { getDb, newId, type Database } from "@/lib/db";
import { DomainError } from "@/lib/errors";
import { recognizeRegion, type RecognizeOptions } from "@/lib/regions";
import { CATEGORIAS, type Categoria, type NeedInterpretation } from "@/modules/ai/schema";
import { interpretNeed, type ClassifyFn } from "@/modules/ai/classify";
import { z } from "zod";

/**
 * Módulo A — Solicitação de ajuda.
 * Fluxo: criar pedido → interpretar com IA (quando disponível) → revisão humana
 * (confirma ou corrige a classificação) → validação pela organização.
 */

export const createRequestSchema = z.object({
  name: z.string().trim().min(2, "Informe um nome ou identificação de demonstração.").max(80),
  region: z.string().trim().min(2, "Informe a região ou bairro.").max(80),
  category: z.enum(CATEGORIAS, { errorMap: () => ({ message: "Escolha uma categoria." }) }),
  item: z.string().trim().max(120).optional().nullable(),
  quantity: z.coerce.number().int().positive().max(100000).optional().nullable(),
  description: z.string().trim().min(10, "Descreva a necessidade em pelo menos 10 caracteres.").max(2000),
  contactMethod: z.string().trim().max(120).optional().nullable()
});

export const reviewSchema = z.object({
  categoria: z.enum(CATEGORIAS),
  item: z.string().trim().max(120).nullable().optional(),
  quantity: z.coerce.number().int().positive().max(100000).nullable().optional()
});

export type AiClassificationAudit = {
  status: "SUGGESTED" | "ACCEPTED" | "CORRECTED" | "MANUAL" | "UNAVAILABLE";
  provider: string | null;
  model: string | null;
  original: NeedInterpretation | null;
  final: { categoria: string; item: string | null; quantidade: number | null } | null;
  corrections: Record<string, { de: unknown; para: unknown }>;
  reason: string | null;
};

export interface RequestRecord {
  id: string;
  /** Código curto legível (ex.: RS-4F7K) — é o que o morador anota. */
  shortCode: string | null;
  userId: string | null;
  category: string;
  item: string | null;
  description: string;
  quantity: number | null;
  region: string;
  contactMethod: string | null;
  status: "PENDING" | "VALIDATED" | "REJECTED" | "FULFILLED";
  aiClassification: AiClassificationAudit | null;
  reviewedAt: string | null;
  createdAt: string;
}

interface RequestRow {
  id: string;
  short_code: string | null;
  owner_session: string | null;
  user_id: string | null;
  category: string;
  item: string | null;
  description: string;
  quantity: number | null;
  region: string;
  contact_method: string | null;
  status: RequestRecord["status"];
  ai_classification: AiClassificationAudit | null;
  reviewed_at: string | Date | null;
  created_at: string | Date;
}

function toRecord(row: RequestRow): RequestRecord {
  return {
    id: row.id,
    shortCode: row.short_code ?? null,
    userId: row.user_id,
    category: row.category,
    item: row.item,
    description: row.description,
    quantity: row.quantity,
    region: row.region,
    contactMethod: row.contact_method,
    status: row.status,
    aiClassification: row.ai_classification,
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
    createdAt: String(row.created_at)
  };
}

/** Alfabeto sem caracteres ambíguos (0/O, 1/I/L). */
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function newShortCode(prefix = "RS"): string {
  let code = "";
  for (let i = 0; i < 4; i += 1) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return `${prefix}-${code}`;
}

export interface RequestDeps {
  db?: Database;
  /** Sessão anônima do navegador que criou o pedido (nunca exposta nas APIs). */
  ownerSession?: string | null;
  classify?: ClassifyFn;
  region?: (input: string, opts?: RecognizeOptions) => Promise<Awaited<ReturnType<typeof recognizeRegion>>>;
}

export async function createRequest(
  input: z.infer<typeof createRequestSchema>,
  deps: RequestDeps = {}
): Promise<{ request: RequestRecord; classification: AiClassificationAudit }> {
  const parsed = createRequestSchema.safeParse(input);
  if (!parsed.success) {
    throw new DomainError(parsed.error.errors.map((e) => e.message).join(" "), 422);
  }
  const data = parsed.data;
  const db = deps.db ?? (await getDb());
  const classify = deps.classify ?? interpretNeed;
  const recognize = deps.region ?? recognizeRegion;

  const recognition = await recognize(data.region, { offline: true });
  const region = recognition.canonical ?? data.region;

  const [user] = await db.query<{ id: string }>(
    "INSERT INTO users (id, name, role, region) VALUES ($1, $2, 'RESIDENT', $3) RETURNING id",
    [newId(), data.name, region]
  );

  // IA: interpretar a descrição. Sem dados pessoais — só descrição e região.
  const aiResult = await classify({
    description: data.description,
    region,
    hint: data.item ? `${data.category}${data.item ? ` — ${data.item}` : ""}` : data.category
  });

  const classification: AiClassificationAudit =
    aiResult.status === "OK"
      ? {
          status: "SUGGESTED",
          provider: aiResult.provider,
          model: aiResult.model,
          original: aiResult.interpretation,
          final: null,
          corrections: {},
          reason: null
        }
      : {
          status: "UNAVAILABLE",
          provider: null,
          model: null,
          original: null,
          final: null,
          corrections: {},
          reason: aiResult.reason
        };

  const record = {
    id: newId(),
    userId: user.id,
    category: data.category,
    item: data.item ?? null,
    description: data.description,
    quantity: data.quantity ?? null,
    region,
    contactMethod: data.contactMethod ?? null,
    classification: JSON.stringify(classification)
  };

  // O código curto é único: em caso de colisão, geramos outro (tentativas limitadas).
  let row: RequestRow | undefined;
  for (let attempt = 0; attempt < 6 && !row; attempt += 1) {
    try {
      [row] = await db.query<RequestRow>(
        `INSERT INTO help_requests
           (id, short_code, user_id, category, item, description, quantity, region, contact_method, status, ai_classification, owner_session)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING', $10::jsonb, $11)
         RETURNING *`,
        [
          record.id,
          newShortCode(),
          record.userId,
          record.category,
          record.item,
          record.description,
          record.quantity,
          record.region,
          record.contactMethod,
          record.classification,
          deps.ownerSession ?? null
        ]
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("short_code")) throw error;
    }
  }
  if (!row) throw new DomainError("Não foi possível gerar o código do pedido. Tente novamente.", 500);

  return { request: toRecord(row), classification };
}

/**
 * Revisão humana da classificação (auditoria da IA).
 * Registra classificação original × corrigida e marca o pedido como revisado.
 */
export async function reviewRequest(
  id: string,
  review: z.infer<typeof reviewSchema>,
  deps: RequestDeps = {}
): Promise<RequestRecord> {
  const parsed = reviewSchema.safeParse(review);
  if (!parsed.success) {
    throw new DomainError(parsed.error.errors.map((e) => e.message).join(" "), 422);
  }
  const db = deps.db ?? (await getDb());
  const [row] = await db.query<RequestRow>("SELECT * FROM help_requests WHERE id = $1", [id]);
  if (!row) throw new DomainError("Pedido não encontrado.", 404);
  if (row.status !== "PENDING") {
    throw new DomainError("Somente pedidos pendentes podem ser revisados.", 409);
  }

  const audit: AiClassificationAudit = row.ai_classification ?? {
    status: "UNAVAILABLE",
    provider: null,
    model: null,
    original: null,
    final: null,
    corrections: {},
    reason: null
  };

  const final = {
    categoria: parsed.data.categoria,
    item: parsed.data.item ?? null,
    quantidade: parsed.data.quantity ?? null
  };

  // Correções: diff entre a sugestão original da IA (ou valores anteriores) e o final.
  const corrections: Record<string, { de: unknown; para: unknown }> = {};
  const baseline = audit.original ?? {
    categoria: row.category,
    item: row.item,
    quantidade: row.quantity
  };
  if (baseline.categoria !== final.categoria) {
    corrections.categoria = { de: baseline.categoria, para: final.categoria };
  }
  if ((baseline.item ?? null) !== final.item) {
    corrections.item = { de: baseline.item ?? null, para: final.item };
  }
  if ((baseline.quantidade ?? null) !== final.quantidade) {
    corrections.quantidade = { de: baseline.quantidade ?? null, para: final.quantidade };
  }

  const sameAsAi = Boolean(audit.original) && Object.keys(corrections).length === 0;
  audit.final = final;
  audit.corrections = corrections;
  audit.status = audit.original
    ? sameAsAi
      ? "ACCEPTED"
      : "CORRECTED"
    : "MANUAL"; // sem IA: classificação manual registrada com honestidade

  const [updated] = await db.query<RequestRow>(
    `UPDATE help_requests
        SET category = $2, item = $3, quantity = $4, ai_classification = $5::jsonb, reviewed_at = now()
      WHERE id = $1
      RETURNING *`,
    [id, final.categoria, final.item, final.quantidade, JSON.stringify(audit)]
  );
  return toRecord(updated);
}

export type RequestStatusUpdate = "VALIDATED" | "REJECTED" | "FULFILLED";

/** Validação/rejeição pela organização (Central de Mobilização). */
export async function updateRequestStatus(
  id: string,
  status: RequestStatusUpdate,
  deps: RequestDeps = {}
): Promise<RequestRecord> {
  const db = deps.db ?? (await getDb());
  const [row] = await db.query<RequestRow>("SELECT * FROM help_requests WHERE id = $1", [id]);
  if (!row) throw new DomainError("Pedido não encontrado.", 404);

  const allowed: Record<string, string[]> = {
    PENDING: ["VALIDATED", "REJECTED"],
    VALIDATED: ["REJECTED", "FULFILLED"],
    REJECTED: [],
    FULFILLED: []
  };
  if (!allowed[row.status]?.includes(status)) {
    throw new DomainError(`Transição inválida: ${row.status} → ${status}.`, 409);
  }

  const [updated] = await db.query<RequestRow>(
    "UPDATE help_requests SET status = $2 WHERE id = $1 RETURNING *",
    [id, status]
  );
  return toRecord(updated);
}

export async function getRequest(id: string, deps: RequestDeps = {}): Promise<RequestRecord | null> {
  const db = deps.db ?? (await getDb());
  // Aceita tanto o UUID quanto o código curto (RS-4F7K), para o link ser amigável.
  const [row] = await db.query<RequestRow>(
    "SELECT * FROM help_requests WHERE id = $1 OR short_code = $2",
    [id, id.trim().toUpperCase()]
  );
  return row ? toRecord(row) : null;
}

const MAX_PAGE_SIZE = 200;
const DEFAULT_PAGE_SIZE = 50;

/** Normaliza paginação vinda de query string (evita `limit=999999`). */
export function pageParams(
  input: { limit?: string | number | null; offset?: string | number | null },
  fallback: number = DEFAULT_PAGE_SIZE
): {
  limit: number;
  offset: number;
} {
  const limitRaw = Number(input.limit);
  const offsetRaw = Number(input.offset);
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0
      ? Math.min(Math.floor(limitRaw), MAX_PAGE_SIZE)
      : Math.min(fallback, MAX_PAGE_SIZE);
  const offset = Number.isFinite(offsetRaw) && offsetRaw > 0 ? Math.floor(offsetRaw) : 0;
  return { limit, offset };
}

export async function listRequests(
  filters: { status?: string; region?: string; limit?: number; offset?: number } = {},
  deps: RequestDeps = {}
): Promise<RequestRecord[]> {
  const db = deps.db ?? (await getDb());
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (filters.status) {
    params.push(filters.status);
    conditions.push(`status = $${params.length}`);
  }
  if (filters.region) {
    params.push(`%${filters.region}%`);
    conditions.push(`region ILIKE $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = Math.min(Math.max(filters.limit ?? MAX_PAGE_SIZE, 1), MAX_PAGE_SIZE);
  const offset = Math.max(filters.offset ?? 0, 0);
  params.push(limit, offset);
  const rows = await db.query<RequestRow>(
    `SELECT * FROM help_requests ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params as never
  );
  return rows.map(toRecord);
}
