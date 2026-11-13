import Link from "next/link";
import { Card, Notice, SectionHeading, Stat } from "@/components/ui";
import {
  IconArrowRight,
  IconCards,
  IconChart,
  IconCheck,
  IconHandHeart,
  IconHeart,
  IconPin,
  IconShield,
  IconSparkle,
  IconUsers
} from "@/components/icons";
import { getDashboard } from "@/modules/mobilization/service";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    n: 1,
    title: "Registrar",
    text: "O morador conta o que aconteceu. A IA sugere categoria, item e quantidade — como apoio, nunca como decisão.",
    icon: IconHandHeart
  },
  {
    n: 2,
    title: "Validar",
    text: "A organização revisa e valida cada pedido na Central. A sugestão da IA pode ser corrigida por uma pessoa.",
    icon: IconShield
  },
  {
    n: 3,
    title: "Conectar",
    text: "Doadores e voluntários cadastram ofertas. O Match Solidário mostra o que combina e explica o porquê.",
    icon: IconCards
  },
  {
    n: 4,
    title: "Acompanhar",
    text: "O interesse é registrado, a organização confirma a conexão e o atendimento é acompanhado até o fim.",
    icon: IconCheck
  }
];

export default async function HomePage() {
  let stats: Awaited<ReturnType<typeof getDashboard>> | null = null;
  try {
    stats = await getDashboard();
  } catch {
    stats = null;
  }

  const hasData = Boolean(stats && stats.totalPedidos > 0);

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-brand-900 text-white shadow-lift">
        <div aria-hidden="true" className="hero-grid absolute inset-0" />
        <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:p-12">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-2xs font-bold uppercase tracking-[0.12em] text-brand-50">
              <IconPin size={14} />
              Região Metropolitana do Recife
            </span>
            <h1 className="mt-5 text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
              Solidariedade organizada,
              <br className="hidden sm:block" /> do relato ao atendimento.
            </h1>
            <p className="mt-4 max-w-xl text-base text-brand-50/90 sm:text-lg">
              Depois da chuva, pedidos de ajuda e doações ficam espalhados. Aqui eles viram conexões rastreáveis:
              a IA interpreta, pessoas validam, e cada atendimento tem dono e status.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/solicitar-ajuda"
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-bold text-brand-900 shadow-soft transition-transform hover:-translate-y-0.5"
              >
                Preciso de ajuda
                <IconArrowRight size={18} />
              </Link>
              <Link
                href="/oferecer-ajuda"
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-white/40 px-6 py-3 text-base font-bold text-white transition-colors hover:bg-white/10"
              >
                <IconHeart size={18} />
                Quero ajudar
              </Link>
            </div>

            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-brand-50/80">
              <li className="flex items-center gap-1.5">
                <IconCheck size={15} /> IA com auditoria humana
              </li>
              <li className="flex items-center gap-1.5">
                <IconCheck size={15} /> Contatos nunca expostos
              </li>
              <li className="flex items-center gap-1.5">
                <IconCheck size={15} /> Endereço só por bairro
              </li>
            </ul>
          </div>

          {/* Painel-resumo: mostra o estado real da rede, não número inventado */}
          <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <p className="text-2xs font-bold uppercase tracking-[0.12em] text-brand-50/80">A rede agora</p>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-200 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-200" />
              </span>
            </div>
            <dl className="mt-4 space-y-3">
              {[
                { label: "Pedidos registrados", value: stats?.totalPedidos ?? 0, icon: IconHandHeart },
                { label: "Ofertas disponíveis", value: stats?.ofertasDisponiveis ?? 0, icon: IconHeart },
                { label: "Atendimentos concluídos", value: stats?.atendimentosConcluidos ?? 0, icon: IconCheck }
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3 rounded-xl bg-white/10 px-3.5 py-3">
                  <dt className="flex items-center gap-2 text-sm text-brand-50/90">
                    <row.icon size={16} />
                    {row.label}
                  </dt>
                  <dd className="text-xl font-bold tabular-nums">{row.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs text-brand-50/70">
              {hasData
                ? "Números calculados dos registros no banco. Dados de demonstração são fictícios."
                : "Ainda sem registros neste ambiente. Cadastre um pedido ou rode o seed de demonstração."}
            </p>
          </div>
        </div>
      </section>

      {/* ── Como funciona ────────────────────────────────────────────────── */}
      <section aria-labelledby="como-funciona">
        <SectionHeading
          title="Como funciona"
          description="Quatro passos, com uma pessoa no meio de cada decisão importante."
        />
        <ol id="como-funciona" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <li key={step.n} className="relative">
              <div className="h-full rounded-2xl border border-line bg-surface p-5 shadow-soft">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700"
                  >
                    <step.icon size={20} />
                  </span>
                  <span className="text-2xs font-bold uppercase tracking-[0.12em] text-muted">Passo {step.n}</span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-ink">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Indicadores ──────────────────────────────────────────────────── */}
      {hasData && stats && (
        <section aria-labelledby="indicadores">
          <SectionHeading
            title="A rede em números"
            description="Indicadores calculados dos registros persistidos — atualizados a cada acesso."
            action={
              <Link
                href="/central"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-800 hover:underline"
              >
                Ver painel completo <IconArrowRight size={15} />
              </Link>
            }
          />
          <div id="indicadores" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat
              label="Pedidos"
              value={stats.totalPedidos}
              hint={`${stats.pedidosPendentes} aguardando validação`}
              icon={<IconHandHeart size={18} />}
            />
            <Stat
              label="Ofertas"
              value={stats.ofertasDisponiveis}
              hint={`${stats.ofertasCadastradas} cadastradas`}
              icon={<IconHeart size={18} />}
            />
            <Stat
              label="Conexões"
              value={stats.matchesComInteresse}
              hint={`${stats.matchesConfirmados} confirmadas`}
              icon={<IconCards size={18} />}
            />
            <Stat
              label="Atendidos"
              value={stats.indicadorPrincipal.atendimentosConcluidos}
              hint={`${stats.indicadorPrincipal.percentual.toFixed(1)}% dos validados`}
              icon={<IconChart size={18} />}
            />
          </div>
        </section>
      )}

      {/* ── Transparência + Central ──────────────────────────────────────── */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card
          eyebrow="Transparência"
          title="A IA sugere. A pessoa decide."
          className="h-full"
        >
          <p className="text-sm leading-relaxed text-muted">
            A classificação automática é registrada como sugestão, com modelo e origem. Quando alguém corrige, a
            correção fica gravada junto — inclusive o valor anterior. Se o serviço de IA estiver fora do ar, o
            sistema avisa e trabalha com classificação manual: <strong className="text-ink">nunca simulamos</strong>{" "}
            um resultado de IA.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              "Sugestão, correção e validação com data",
              "Regras objetivas definem a compatibilidade",
              "Nenhum dado de contato no cartão público"
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-ink/80">
                <IconSparkle size={16} className="mt-0.5 shrink-0 text-brand-600" />
                {item}
              </li>
            ))}
          </ul>
        </Card>

        <Card eyebrow="Organizações" title="Central de Mobilização" className="flex h-full flex-col">
          <p className="text-sm leading-relaxed text-muted">
            Associações e organizações validam pedidos, confirmam conexões e registram atendimentos em um painel só,
            com indicador de resultado e distribuição por categoria e bairro.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-2xs font-bold uppercase tracking-[0.08em] text-muted">
            <span className="rounded-full border border-line px-2.5 py-1">Validar</span>
            <span className="rounded-full border border-line px-2.5 py-1">Confirmar</span>
            <span className="rounded-full border border-line px-2.5 py-1">Acompanhar</span>
            <span className="rounded-full border border-line px-2.5 py-1">Medir</span>
          </div>
          <div className="mt-auto pt-5">
            <Link
              href="/central"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-bold text-white shadow-soft hover:bg-brand-800"
            >
              <IconUsers size={17} />
              Acessar a Central
            </Link>
          </div>
        </Card>
      </section>

      <Notice kind="info" title="Sobre os limites deste sistema">
        A plataforma organiza pedidos e ofertas; ela não substitui a Defesa Civil nem serviços de emergência. Todos os
        registros marcados como <strong>(DEMONSTRAÇÃO — fictício)</strong> são inventados para teste e não representam
        pessoas, famílias ou organizações reais.
      </Notice>
    </div>
  );
}
