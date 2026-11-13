import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, Notice, SectionHeading } from "@/components/ui";
import { RequestStatusBadge, MatchStatusBadge } from "@/components/StatusBadge";
import { IconArrowRight, IconBox, IconClock, IconPin, IconShield, IconSparkle } from "@/components/icons";
import { getRequest } from "@/modules/requests/service";
import { listMatches } from "@/modules/matching/service";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Aceita UUID ou código curto (RS-4F7K).
  const request = await getRequest(id);
  if (!request) notFound();

  const matches = (await listMatches()).filter((match) => match.requestId === request.id);
  const audit = request.aiClassification;

  const timeline = [
    { label: "Pedido registrado", hint: "Recebemos o relato", done: true, date: request.createdAt },
    {
      label: "Classificação revisada por pessoa",
      hint: "A sugestão da IA foi conferida",
      done: Boolean(request.reviewedAt),
      date: request.reviewedAt
    },
    {
      label: "Validado pela organização",
      hint: "Equipe conferiu o pedido",
      done: ["VALIDATED", "FULFILLED"].includes(request.status),
      date: null
    },
    {
      label: "Atendimento concluído",
      hint: "Entrega ou serviço realizado",
      done: request.status === "FULFILLED",
      date: null
    }
  ];

  const currentStep = timeline.filter((step) => step.done).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-2xs font-bold uppercase tracking-[0.12em] text-brand-700">
          <IconShield size={15} /> Acompanhamento do pedido
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            {request.category}
            {request.item ? ` — ${request.item}` : ""}
          </h1>
          <RequestStatusBadge status={request.status} />
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
          {request.shortCode && (
            <Badge tone="neutral" className="font-mono tracking-[0.1em]">
              {request.shortCode}
            </Badge>
          )}
          <span className="inline-flex items-center gap-1">
            <IconPin size={13} /> {request.region}
          </span>
          <span className="inline-flex items-center gap-1">
            <IconClock size={13} /> {formatDateTime(request.createdAt)}
          </span>
          {request.quantity != null && (
            <span className="inline-flex items-center gap-1">
              <IconBox size={13} /> {request.quantity} unidade(s)
            </span>
          )}
        </div>
      </header>

      <Card eyebrow={`Etapa ${currentStep} de 4`} title="Situação do pedido">
        <ol className="space-y-4">
          {timeline.map((step, index) => (
            <li key={step.label} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={
                  step.done
                    ? "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white"
                    : "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-line bg-white text-sm font-bold text-muted"
                }
              >
                {step.done ? "✓" : index + 1}
              </span>
              <div className="min-w-0">
                <p className={step.done ? "font-semibold text-ink" : "font-semibold text-muted"}>
                  {step.label}
                  <span className="sr-only">{step.done ? " (concluído)" : " (pendente)"}</span>
                </p>
                <p className="text-sm text-muted">{step.done && step.date ? formatDateTime(step.date) : step.hint}</p>
              </div>
            </li>
          ))}
        </ol>

        {matches.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl bg-canvas p-3">
            <Badge tone="neutral">{matches.length} conexão(ões)</Badge>
            <span className="text-sm text-muted">
              A organização confirma o contato com quem ofereceu ajuda.
            </span>
          </div>
        )}
      </Card>

      <Card title="Dados do pedido">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-canvas p-3">
            <dt className="text-2xs font-bold uppercase tracking-[0.08em] text-muted">Categoria</dt>
            <dd className="mt-1 font-semibold text-ink">{request.category}</dd>
          </div>
          <div className="rounded-xl bg-canvas p-3">
            <dt className="text-2xs font-bold uppercase tracking-[0.08em] text-muted">Região aproximada</dt>
            <dd className="mt-1 font-semibold text-ink">{request.region}</dd>
          </div>
          {request.item && (
            <div className="rounded-xl bg-canvas p-3">
              <dt className="text-2xs font-bold uppercase tracking-[0.08em] text-muted">Item</dt>
              <dd className="mt-1 font-semibold text-ink">{request.item}</dd>
            </div>
          )}
          {request.quantity != null && (
            <div className="rounded-xl bg-canvas p-3">
              <dt className="text-2xs font-bold uppercase tracking-[0.08em] text-muted">Quantidade</dt>
              <dd className="mt-1 font-semibold text-ink">{request.quantity}</dd>
            </div>
          )}
        </dl>
        <div className="mt-3 rounded-xl border border-line p-3">
          <p className="text-2xs font-bold uppercase tracking-[0.08em] text-muted">Relato</p>
          <p className="mt-1 text-ink/85">{request.description}</p>
        </div>
        <p className="mt-3 text-xs text-muted">
          Por privacidade, não exibimos contato nem endereço. A aproximação entre as partes é feita pela organização.
        </p>
      </Card>

      {audit && (
        <Card eyebrow="Auditoria" title="Transparência da classificação">
          {audit.status === "UNAVAILABLE" ? (
            <Notice kind="warning" title="Análise automática indisponível">
              {audit.reason ?? "Motivo não informado"}. A classificação foi feita manualmente — nada foi atribuído à IA.
            </Notice>
          ) : (
            <div className="space-y-3 text-sm">
              <p className="flex flex-wrap items-center gap-2">
                <Badge tone={audit.status === "CORRECTED" ? "alert" : "brand"} dot>
                  {audit.status === "SUGGESTED"
                    ? "sugestão aguardando revisão"
                    : audit.status === "ACCEPTED"
                      ? "sugestão confirmada por pessoa"
                      : audit.status === "CORRECTED"
                        ? "sugestão corrigida por pessoa"
                        : "classificação manual"}
                </Badge>
                {audit.model && <span className="text-muted">modelo {audit.model}</span>}
              </p>

              {audit.original && (
                <div className="rounded-xl bg-canvas p-3">
                  <p className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-[0.08em] text-muted">
                    <IconSparkle size={13} /> Sugestão original da IA
                  </p>
                  <p className="mt-1 text-ink/85">
                    {audit.original.categoria}
                    {audit.original.item ? ` · ${audit.original.item}` : ""}
                    {audit.original.quantidade ? ` · qtd ${audit.original.quantidade}` : ""}
                    {audit.original.contexto ? ` · ${audit.original.contexto}` : ""}
                  </p>
                </div>
              )}

              {Object.keys(audit.corrections).length > 0 && (
                <div>
                  <p className="text-2xs font-bold uppercase tracking-[0.08em] text-muted">Correções humanas</p>
                  <ul className="mt-1 space-y-1">
                    {Object.entries(audit.corrections).map(([field, change]) => (
                      <li key={field} className="text-ink/85">
                        {field}: <span className="text-danger line-through">{String(change.de ?? "(vazio)")}</span> →{" "}
                        <strong className="text-brand-800">{String(change.para ?? "(vazio)")}</strong>
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
        <section>
          <SectionHeading title="Conexões relacionadas" description="Sugestões e interesses ligados a este pedido." />
          <ul className="space-y-2">
            {matches.map((match) => (
              <li key={match.id} className="rounded-xl border border-line bg-surface p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <MatchStatusBadge status={match.status} />
                  {match.requesterInterested && <Badge tone="brand">morador com interesse</Badge>}
                  {match.providerInterested && <Badge tone="brand">doador com interesse</Badge>}
                </div>
                <p className="mt-2 text-sm text-muted">{match.compatibilityReason}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Link
          href={`/match?mode=preciso&requestId=${request.id}`}
          className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 py-3 text-sm font-bold text-white shadow-soft hover:bg-brand-800"
        >
          Ver ofertas compatíveis <IconArrowRight size={16} />
        </Link>
        <Link
          href="/meus-pedidos"
          className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-line bg-white px-5 py-3 text-sm font-bold text-ink hover:border-brand-300 hover:bg-brand-50"
        >
          Meus pedidos
        </Link>
      </div>
    </div>
  );
}
