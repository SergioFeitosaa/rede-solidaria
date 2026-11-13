import { getDb, type Database } from "@/lib/db";
import { DomainError } from "@/lib/errors";

/**
 * Módulo D — Central de Mobilização: atendimentos e indicadores.
 * Todos os indicadores são calculados com dados persistidos no banco.
 */

export interface AttendanceRecord {
  id: string;
  matchId: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  validatedBy: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface AttendanceRow {
  id: string;
  match_id: string;
  status: AttendanceRecord["status"];
  validated_by: string | null;
  completed_at: string | Date | null;
  created_at: string | Date;
}

function toRecord(row: AttendanceRow): AttendanceRecord {
  return {
    id: row.id,
    matchId: row.match_id,
    status: row.status,
    validatedBy: row.validated_by,
    completedAt: row.completed_at ? String(row.completed_at) : null,
    createdAt: String(row.created_at)
  };
}

export interface AttendanceDeps {
  db?: Database;
}

const ATTENDANCE_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: []
};

/**
 * Avança o atendimento respeitando a máquina de estados:
 * PENDING → IN_PROGRESS → COMPLETED (ou CANCELLED antes de concluir).
 * COMPLETED marca o pedido como FULFILLED; CANCELLED devolve a oferta ao pool.
 */
export async function updateAttendance(
  id: string,
  status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
  deps: AttendanceDeps = {}
): Promise<AttendanceRecord> {
  const db = deps.db ?? (await getDb());
  const [row] = await db.query<AttendanceRow>("SELECT * FROM attendances WHERE id = $1", [id]);
  if (!row) throw new DomainError("Atendimento não encontrado.", 404);

  const allowed = ATTENDANCE_TRANSITIONS[row.status] ?? [];
  if (!allowed.includes(status)) {
    throw new DomainError(`Transição inválida: ${row.status} → ${status}.`, 409);
  }

  const [updated] = await db.query<AttendanceRow>(
    `UPDATE attendances
        SET status = $2,
            completed_at = CASE WHEN $2 = 'COMPLETED' THEN now() ELSE completed_at END
      WHERE id = $1
      RETURNING *`,
    [id, status]
  );

  if (status === "COMPLETED") {
    // Conclusão do atendimento conclui o pedido correspondente.
    await db.query(
      `UPDATE help_requests SET status = 'FULFILLED'
        WHERE id = (SELECT request_id FROM matches WHERE id = $1)`,
      [row.match_id]
    );
  }
  if (status === "CANCELLED") {
    // Libera a oferta de volta para o pool.
    await db.query(
      `UPDATE help_offers SET status = 'AVAILABLE'
        WHERE id = (SELECT offer_id FROM matches WHERE id = $1)`,
      [row.match_id]
    );
  }

  return toRecord(updated);
}

export async function getAttendance(id: string, deps: AttendanceDeps = {}): Promise<AttendanceRecord | null> {
  const db = deps.db ?? (await getDb());
  const [row] = await db.query<AttendanceRow>("SELECT * FROM attendances WHERE id = $1", [id]);
  return row ? toRecord(row) : null;
}

export async function listAttendances(deps: AttendanceDeps = {}): Promise<AttendanceRecord[]> {
  const db = deps.db ?? (await getDb());
  const rows = await db.query<AttendanceRow>(
    "SELECT * FROM attendances ORDER BY created_at DESC LIMIT 200"
  );
  return rows.map(toRecord);
}

export interface DashboardData {
  totalPedidos: number;
  pedidosPendentes: number;
  pedidosValidados: number;
  pedidosRejeitados: number;
  pedidosAtendidos: number;
  ofertasCadastradas: number;
  ofertasDisponiveis: number;
  matchesComInteresse: number;
  matchesConfirmados: number;
  atendimentosConcluidos: number;
  porCategoria: Array<{ categoria: string; total: number }>;
  porRegiao: Array<{ regiao: string; total: number }>;
  indicadorPrincipal: {
    rotulo: string;
    percentual: number;
    atendimentosConcluidos: number;
    pedidosValidados: number;
    formula: string;
    observacao: string;
  };
}

function countOf(rows: Array<Record<string, unknown>>, key: string, value: string): number {
  const row = rows.find((r) => String(r[key]) === value);
  return row ? Number(row.total) : 0;
}

/** Indicadores agregados — 100% calculados de dados persistidos. */
export async function getDashboard(deps: AttendanceDeps = {}): Promise<DashboardData> {
  const db = deps.db ?? (await getDb());

  const reqStatusRows = await db.query<Record<string, unknown>>(
    "SELECT status, COUNT(*)::int AS total FROM help_requests GROUP BY status"
  );
  const offerStatusRows = await db.query<Record<string, unknown>>(
    "SELECT status, COUNT(*)::int AS total FROM help_offers GROUP BY status"
  );
  const matchStatusRows = await db.query<Record<string, unknown>>(
    "SELECT status, COUNT(*)::int AS total FROM matches GROUP BY status"
  );
  const attendanceStatusRows = await db.query<Record<string, unknown>>(
    "SELECT status, COUNT(*)::int AS total FROM attendances GROUP BY status"
  );
  const porCategoria = await db.query<{ categoria: string; total: number }>(
    `SELECT category AS categoria, COUNT(*)::int AS total
       FROM help_requests GROUP BY category ORDER BY total DESC`
  );
  const porRegiao = await db.query<{ regiao: string; total: number }>(
    `SELECT region AS regiao, COUNT(*)::int AS total
       FROM help_requests GROUP BY region ORDER BY total DESC LIMIT 12`
  );

  const totalPedidos = reqStatusRows.reduce((s, r) => s + Number(r.total), 0);
  const pedidosPendentes = countOf(reqStatusRows, "status", "PENDING");
  const pedidosRejeitados = countOf(reqStatusRows, "status", "REJECTED");
  const pedidosAtendidos = countOf(reqStatusRows, "status", "FULFILLED");
  // Pedidos validados = VALIDATED + FULFILLED (todo pedido atendido já foi validado).
  const pedidosValidados = countOf(reqStatusRows, "status", "VALIDATED") + pedidosAtendidos;

  const ofertasCadastradas = offerStatusRows.reduce((s, r) => s + Number(r.total), 0);
  const ofertasDisponiveis = countOf(offerStatusRows, "status", "AVAILABLE");

  const matchesComInteresse =
    countOf(matchStatusRows, "status", "INTERESTED") +
    countOf(matchStatusRows, "status", "PENDING_CONFIRMATION") +
    countOf(matchStatusRows, "status", "CONFIRMED");
  const matchesConfirmados = countOf(matchStatusRows, "status", "CONFIRMED");
  const atendimentosConcluidos = countOf(attendanceStatusRows, "status", "COMPLETED");

  // Indicador principal do edital:
  // atendimentos concluídos associados a pedidos distintos / pedidos validados × 100.
  const [distinct] = await db.query<{ total: number }>(
    `SELECT COUNT(DISTINCT m.request_id)::int AS total
       FROM attendances a JOIN matches m ON m.id = a.match_id
      WHERE a.status = 'COMPLETED'`
  );
  const atendimentosDistintos = Number(distinct?.total ?? 0);
  const percentual = pedidosValidados > 0 ? (atendimentosDistintos / pedidosValidados) * 100 : 0;

  return {
    totalPedidos,
    pedidosPendentes,
    pedidosValidados,
    pedidosRejeitados,
    pedidosAtendidos,
    ofertasCadastradas,
    ofertasDisponiveis,
    matchesComInteresse,
    matchesConfirmados,
    atendimentosConcluidos,
    porCategoria: porCategoria.map((r) => ({ categoria: r.categoria, total: Number(r.total) })),
    porRegiao: porRegiao.map((r) => ({ regiao: r.regiao, total: Number(r.total) })),
    indicadorPrincipal: {
      rotulo: "Pedidos validados que tiveram atendimento concluído",
      percentual,
      atendimentosConcluidos: atendimentosDistintos,
      pedidosValidados,
      formula: "atendimentos concluídos (pedidos distintos) ÷ pedidos validados × 100",
      observacao:
        totalPedidos > 0
          ? "Indicador calculado sobre registros persistidos. Dados de demonstração são simulados."
          : "Sem registros no banco ainda."
    }
  };
}
