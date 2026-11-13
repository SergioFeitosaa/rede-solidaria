import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Notice } from "@/components/ui";
import { RequestStatusBadge, MatchStatusBadge } from "@/components/StatusBadge";
import { getRequest } from "@/modules/requests/service";
import { listMatches } from "@/modules/matching/service";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const request = await getRequest(id);
  if (!request) notFound();

  const matches = (await listMatches()).filter((m) => m.requestId === id);
  const audit = request.aiClassification;

  const timeline = [
    { label: "Pedido registrado", done: true, date: request.createdAt },
    {
      label: "Classificação revisada por pessoa",
      done: Boolean(request.reviewedAt),
      date: request.reviewedAt
    },
    {
      label: "Validado pela organização",
      done: ["VALIDATED", "FULFILLED"].includes(request.status),
      date: null
    },
    {
      label: "Atendimento concluído",
      done: request.status === "FULFILLED",
      date: null
    }
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold text-ink">Acompanhar pedido</h1>
        <RequestStatusBadge status={request.status} />
      </header>

      <Card title="Situação do pedido">
        <ol className="space-y-3">
          {timeline.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  step.done ? "bg-brand-700 text-white" : "border-2 border-ink/20 bg-white text-ink/40"
                }`}
              >
                {step.done ? "✓" : i + 1}
              </span>
              <div>
                <p className={`font-semibold ${step.done ? "text-ink" : "text-ink/50"}`}>
                  {step.label}
                  {step.done && <span className="sr-only"> (concluído)</span>}
                  {!step.done && <span className="sr-only"> (pendente)</span>}
                </p>
                {step.date && <p className="text-sm text-ink/60">{formatDateTime(step.date)}</p>}
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <Card title="Dados do pedido">
        <dl className="space-y-2 text-ink/80">
          <div>
            <dt className="inline font-semibold text-ink">Categoria: </dt>
            <dd className="inline">{request.category}</dd>
          </div>
          {request.item && (
            <div>
              <dt className="inline font-semibold text-ink">Item: </dt>
              <dd className="inline">{request.item}</dd>
            </div>
          )}
          {request.quantity != null && (
            <div>
              <dt className="inline font-semibold text-ink">Quantidade: </dt>
              <dd className="inline">{request.quantity}</dd>
            </div>
          )}
          <div>
            <dt className="inline font-semibold text-ink">Região aproximada: </dt>
            <dd className="inline">{request.region}</dd>
          </div>
          <div>
            <dt className="inline font-semibold text-ink">Relato: </dt>
            <dd className="inline">{request.description}</dd>
          </div>
        </dl>
      </Card>

      {audit && (
        <Card title="Transparência da classificação (IA)">
          {audit.status === "UNAVAILABLE" ? (
            <Notice kind="warning">
              A análise automática estava indisponível ({audit.reason ?? "motivo não informado"}). A
              classificação foi feita manualmente — nada foi atribuído à IA.
            </Notice>
          ) : (
            <div className="space-y-3 text-sm">
              <p>
                <strong>Estado:</strong>{" "}
                {audit.status === "SUGGESTED"
                  ? "sugestão da IA aguardando revisão humana"
                  : audit.status === "ACCEPTED"
                    ? "sugestão da IA confirmada por pessoa"
                    : audit.status === "CORRECTED"
                      ? "sugestão da IA corrigida por pessoa"
                      : "classificação manual"}
                {audit.model ? ` · modelo ${audit.model}` : ""}
              </p>
              {audit.original && (
                <p>
                  <strong>Sugestão original da IA:</strong> {audit.original.categoria}
                  {audit.original.item ? ` · ${audit.original.item}` : ""}
                  {audit.original.quantidade ? ` · qtd ${audit.original.quantidade}` : ""}
                  {audit.original.contexto ? ` · ${audit.original.contexto}` : ""}
                </p>
              )}
              {Object.keys(audit.corrections).length > 0 && (
                <div>
                  <strong>Correções humanas:</strong>
                  <ul className="mt-1 list-inside list-disc">
                    {Object.entries(audit.corrections).map(([field, change]) => (
                      <li key={field}>
                        {field}: {String(change.de ?? "(vazio)")} → <strong>{String(change.para ?? "(vazio)")}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {matches.length > 0 && (
        <Card title="Conexões relacionadas">
          <ul className="space-y-3">
            {matches.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-ink/10 p-3">
                <MatchStatusBadge status={m.status} />
                <span className="text-sm text-ink/70">{m.compatibilityReason}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href="/match?mode=preciso" className="text-brand-800 underline underline-offset-4">
          Ver ofertas no Match Solidário
        </Link>
        <Link href="/" className="text-brand-800 underline underline-offset-4">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
