import { Badge } from "./ui";

const REQUEST_STATUS: Record<string, { label: string; tone: "brand" | "sand" | "alert" | "danger" }> = {
  PENDING: { label: "Aguardando validação", tone: "alert" },
  VALIDATED: { label: "Validado", tone: "brand" },
  REJECTED: { label: "Não validado", tone: "danger" },
  FULFILLED: { label: "Atendido", tone: "brand" }
};

const MATCH_STATUS: Record<string, { label: string; tone: "brand" | "sand" | "alert" | "danger" }> = {
  SUGGESTED: { label: "Sugerido", tone: "sand" },
  INTERESTED: { label: "Com interesse", tone: "alert" },
  PENDING_CONFIRMATION: { label: "Aguardando confirmação", tone: "alert" },
  CONFIRMED: { label: "Confirmado", tone: "brand" },
  REJECTED: { label: "Recusado", tone: "danger" }
};

const ATTENDANCE_STATUS: Record<string, { label: string; tone: "brand" | "sand" | "alert" | "danger" }> = {
  PENDING: { label: "Aguardando início", tone: "alert" },
  IN_PROGRESS: { label: "Em andamento", tone: "alert" },
  COMPLETED: { label: "Concluído", tone: "brand" },
  CANCELLED: { label: "Cancelado", tone: "danger" }
};

export function RequestStatusBadge({ status }: { status: string }) {
  const info = REQUEST_STATUS[status] ?? { label: status, tone: "sand" as const };
  return <Badge tone={info.tone}>{info.label}</Badge>;
}

export function MatchStatusBadge({ status }: { status: string }) {
  const info = MATCH_STATUS[status] ?? { label: status, tone: "sand" as const };
  return <Badge tone={info.tone}>{info.label}</Badge>;
}

export function AttendanceStatusBadge({ status }: { status: string }) {
  const info = ATTENDANCE_STATUS[status] ?? { label: status, tone: "sand" as const };
  return <Badge tone={info.tone}>{info.label}</Badge>;
}
