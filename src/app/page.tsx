import Link from "next/link";
import { Card, Stat, Notice } from "@/components/ui";
import { getDashboard } from "@/modules/mobilization/service";

export const dynamic = "force-dynamic";

const STEPS = [
  { n: 1, title: "Registrar", text: "O morador registra o pedido de ajuda. A IA interpreta a descrição e sugere a classificação." },
  { n: 2, title: "Validar", text: "A organização valida o pedido na Central de Mobilização. A IA sempre passa por revisão humana." },
  { n: 3, title: "Conectar", text: "Doadores e voluntários cadastram ofertas. O Match Solidário recomenda compatibilidades com explicação." },
  { n: 4, title: "Acompanhar", text: "O interesse é registrado com Swipe ou botão. A organização confirma e conclui o atendimento." }
];

export default async function HomePage() {
  let stats: Awaited<ReturnType<typeof getDashboard>> | null = null;
  try {
    stats = await getDashboard();
  } catch {
    stats = null;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-br from-brand-800 to-brand-600 p-6 text-white sm:p-10">
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
          Conectando pessoas. Organizando a solidariedade. Reconstruindo comunidades.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-brand-50">
          Após eventos climáticos na Região Metropolitana do Recife, transformamos pedidos de ajuda e
          ofertas dispersas em conexões organizadas, transparentes e acompanháveis.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/solicitar-ajuda"
            className="inline-flex min-h-[48px] items-center rounded-xl bg-white px-6 py-3 text-base font-bold text-brand-800 hover:bg-brand-50"
          >
            Solicitar ajuda
          </Link>
          <Link
            href="/oferecer-ajuda"
            className="inline-flex min-h-[48px] items-center rounded-xl border-2 border-white px-6 py-3 text-base font-bold text-white hover:bg-brand-700"
          >
            Quero ajudar
          </Link>
          <Link
            href="/match"
            className="inline-flex min-h-[48px] items-center rounded-xl border-2 border-brand-200 px-6 py-3 text-base font-bold text-brand-50 hover:bg-brand-700"
          >
            Ver Match Solidário
          </Link>
        </div>
      </section>

      {stats && stats.totalPedidos > 0 && (
        <section aria-label="Indicadores da rede">
          <h2 className="mb-3 text-2xl font-bold text-ink">A rede em números</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Pedidos registrados" value={stats.totalPedidos} />
            <Stat label="Ofertas disponíveis" value={stats.ofertasDisponiveis} />
            <Stat label="Matches com interesse" value={stats.matchesComInteresse} />
            <Stat
              label="Pedidos atendidos"
              value={stats.indicadorPrincipal.atendimentosConcluidos}
              hint={`${stats.indicadorPrincipal.percentual.toFixed(1)}% dos pedidos validados`}
            />
          </div>
          <p className="mt-2 text-xs text-ink/60">
            Indicadores calculados de registros persistidos. Dados de demonstração são simulados.
          </p>
        </section>
      )}

      <section aria-label="Como funciona">
        <h2 className="mb-4 text-2xl font-bold text-ink">Como funciona</h2>
        <ol className="grid gap-4 sm:grid-cols-2">
          {STEPS.map((step) => (
            <li key={step.n}>
              <Card>
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-700 text-lg font-bold text-white"
                  >
                    {step.n}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-ink">{step.title}</h3>
                    <p className="mt-1 text-ink/70">{step.text}</p>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <Notice kind="info">
        <p>
          <strong>IA com auditoria humana:</strong> a classificação automática de necessidades é uma
          sugestão. Toda classificação pode ser corrigida por pessoas e a organização valida cada pedido
          antes de qualquer atendimento. A IA nunca decide sozinha quem recebe ajuda.
        </p>
      </Notice>

      <Card title="Central de Mobilização">
        <p className="text-ink/70">
          Organizações e associações acompanham pedidos, validam solicitações, confirmam matches e
          registram atendimentos em um painel só.
        </p>
        <Link
          href="/central"
          className="mt-3 inline-flex min-h-[48px] items-center rounded-xl bg-brand-700 px-6 py-3 font-semibold text-white hover:bg-brand-800"
        >
          Acessar a Central
        </Link>
      </Card>
    </div>
  );
}
