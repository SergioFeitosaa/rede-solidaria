import Link from "next/link";
import { Card, Notice, SectionHeading } from "@/components/ui";
import {
  IconArrowRight,
  IconCards,
  IconCheck,
  IconHandHeart,
  IconHeart,
  IconLeaf,
  IconList,
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

  const shortcuts = [
    {
      href: "/match",
      icon: IconHeart,
      title: "Match Solidário com swipe",
      badge: stats ? `${stats.ofertasDisponiveis} disponíveis` : undefined,
      text: "Arraste para demonstrar interesse, como em um app de match."
    },
    {
      href: "/meus-pedidos",
      icon: IconList,
      title: "Meus pedidos",
      text: "Acompanhe o status de cada pedido e oferta que você registrou."
    },
    {
      href: "/central",
      icon: IconUsers,
      title: "Central de Mobilização",
      text: "Validação, conexões confirmadas e atendimentos em um painel só."
    }
  ];

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-line bg-white shadow-soft">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_100%_0%,#fdf2ea_0%,transparent_55%),radial-gradient(90%_70%_at_0%_100%,#f3f8f4_0%,transparent_60%)]"
        />
        <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:p-12">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white/90 px-3 py-1.5 text-2xs font-bold uppercase tracking-[0.14em] text-ink/70">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent-500" />
              Solidariedade organizada na RMR
            </span>

            <h1 className="mt-5 text-4xl font-extrabold leading-[1.03] tracking-[-0.03em] text-brand-950 sm:text-5xl lg:text-6xl">
              Quando a água sobe,
              <br />
              a rede se <span className="text-accent-500">move.</span>
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Conectamos quem precisa a quem pode ajudar, com inteligência, cuidado e acompanhamento de organizações
              locais.
            </p>

            <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
              <Link
                href="/solicitar-ajuda"
                className="group flex items-center gap-3 rounded-2xl bg-brand-700 p-4 text-white shadow-soft transition-transform hover:-translate-y-0.5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <IconHandHeart size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-bold">Preciso de ajuda</span>
                  <span className="block text-xs text-brand-50/85">Registre uma necessidade</span>
                </span>
                <IconArrowRight size={18} className="ml-auto shrink-0 opacity-80" />
              </Link>

              <Link
                href="/oferecer-ajuda"
                className="group flex items-center gap-3 rounded-2xl border border-line bg-white p-4 text-ink shadow-soft transition-transform hover:-translate-y-0.5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                  <IconHeart size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-bold">Quero ajudar</span>
                  <span className="block text-xs text-muted">Ofereça itens ou tempo</span>
                </span>
                <IconArrowRight size={18} className="ml-auto shrink-0 text-muted" />
              </Link>
            </div>

            <ul className="mt-7 space-y-2">
              {shortcuts.map((shortcut) => (
                <li key={shortcut.href}>
                  <Link
                    href={shortcut.href}
                    className="group flex items-center gap-3 rounded-2xl border border-line bg-white/80 px-4 py-3 transition-colors hover:border-accent-200 hover:bg-accent-50/50"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                      <shortcut.icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-ink">{shortcut.title}</span>
                        {shortcut.badge && (
                          <span className="rounded-full bg-accent-100 px-2 py-0.5 text-2xs font-bold uppercase tracking-[0.06em] text-accent-800">
                            {shortcut.badge}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">{shortcut.text}</span>
                    </span>
                    <IconArrowRight size={16} className="shrink-0 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Painel-resumo: estado real da rede, sem número inventado */}
          <div className="rounded-3xl bg-brand-800 p-5 text-white shadow-lift sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-2xs font-bold uppercase tracking-[0.14em] text-brand-100/80">Rede em movimento</p>
                <p className="mt-1.5 text-xl font-extrabold tracking-tight">Ajuda que chega.</p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-accent-300">
                <IconSparkle size={18} />
              </span>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-2.5">
              {[
                { label: "pedidos já cadastrados", value: stats?.totalPedidos ?? 0 },
                { label: "ofertas disponíveis", value: stats?.ofertasDisponiveis ?? 0 }
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/[0.07] p-3.5">
                  <dd className="text-2xl font-extrabold tabular-nums">{item.value}</dd>
                  <dt className="mt-0.5 text-2xs text-brand-100/75">{item.label}</dt>
                </div>
              ))}
            </dl>

            <div className="mt-2.5 flex items-start gap-3 rounded-2xl bg-accent-50 p-3.5 text-accent-900">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-accent-600">
                <IconShield size={17} />
              </span>
              <span>
                <span className="block text-sm font-bold">IA com revisão humana</span>
                <span className="block text-xs text-accent-800/80">Organiza relatos sem decidir sozinha.</span>
              </span>
            </div>

            <p className="mt-3 text-2xs leading-relaxed text-brand-100/60">
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

      {/* ── Transparência + Central ──────────────────────────────────────── */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card eyebrow="Transparência" title="A IA sugere. A pessoa decide." className="h-full">
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
                <IconLeaf size={16} className="mt-0.5 shrink-0 text-brand-600" />
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
          <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
            <Link
              href="/central"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-bold text-white shadow-soft hover:bg-brand-800"
            >
              <IconUsers size={17} />
              Acessar a Central
            </Link>
            {hasData && (
              <Link
                href="/central"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-800 hover:underline"
              >
                Ver indicadores <IconArrowRight size={15} />
              </Link>
            )}
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
