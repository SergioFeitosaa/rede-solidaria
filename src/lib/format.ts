/** Formatação pt-BR para datas e números. */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Recife"
  });
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
