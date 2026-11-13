import { Badge, type BadgeTone } from "./ui";

/**
 * Badges de estado. Cor + rótulo escrito: nunca dependemos só da cor
 * (requisito de acessibilidade do projeto).
 */

type StatusInfo = { label: string; tone: BadgeTone };

const REQUEST_STATUS: Record<string, StatusInfo> = {
  PENDING: { label: "Aguardando validação", tone: "alert" },
  VALIDATED: { label: "Validado", tone: "success" },
  REJECTED: { label: "Não validado", tone: "danger" },
  FULFILLED: { label: "Atendido", tone: "brand" }
};

const MATCH_STATUS: Record<string, StatusInfo> = {
  SUGGESTED: { label: "Sugerido", tone: "neutral" },
  INTERESTED: { label: "Com interesse", tone: "alert" },
  PENDING_CONFIRMATION: { label: "Aguardando confirmação", tone: "alert" },
  CONFIRMED: { label: "Confirmado", tone: "success" },
  REJECTED: { label: "Recusado", tone: "danger" }
};

const ATTENDANCE_STATUS: Record<string, StatusInfo> = {
  PENDING: { label: "Aguardando início", tone: "alert" },
  IN_PROGRESS: { label: "Em andamento", tone: "alert" },
  COMPLETED: { label: "Concluído", tone: "success" },
  CANCELLED: { label: "Cancelado", tone: "danger" }
};

function fallback(status: string): StatusInfo {
  return { label: status, tone: "neutral" };
}

export function RequestStatusBadge({ status }: { status: string }) {
  const info = REQUEST_STATUS[status] ?? fallback(status);
  return (
    <Badge tone={info.tone} dot>
      {info.label}
    </Badge>
  );
}

export function MatchStatusBadge({ status }: { status: string }) {
  const info = MATCH_STATUS[status] ?? fallback(status);
  return (
    <Badge tone={info.tone} dot>
      {info.label}
    </Badge>
  );
}

export function AttendanceStatusBadge({ status }: { status: string }) {
  const info = ATTENDANCE_STATUS[status] ?? fallback(status);
  return (
    <Badge tone={info.tone} dot>
      {info.label}
    </Badge>
  );
}

export function requestStatusLabel(status: string): string {
  return (REQUEST_STATUS[status] ?? fallback(status)).label;
}
