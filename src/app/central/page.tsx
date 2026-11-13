"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, EmptyState, Field, Input, Notice, SectionHeading, Skeleton, Stat, cn } from "@/components/ui";
import { RequestStatusBadge, MatchStatusBadge, AttendanceStatusBadge } from "@/components/StatusBadge";
import {
  IconArrowRight,
  IconCards,
  IconChart,
  IconCheck,
  IconClock,
  IconHandHeart,
  IconHeart,
  IconLock,
  IconLogout,
  IconPin,
  IconSearch,
  IconUsers
} from "@/components/icons";
import { formatDateTime } from "@/lib/format";

/**
 * Central de Mobilização — painel operacional da organização.
 * Acesso protegido por token validado NO SERVIDOR (cookie httpOnly).
 */

type Dashboard = {
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
  };
};

type RequestItem = {
  id: string;
  shortCode: string | null;
  category: string;
  item: string | null;
  quantity: number | null;
  region: string;
  description: string;
  status: string;
  createdAt: string;
};

type MatchItem = {
  id: string;
  requestId: string;
  offerId: string;
  compatibilityReason: string;
  requesterInterested: boolean;
  providerInterested: boolean;
  status: string;
};

type AttendanceItem = {
  id: string;
  matchId: string;
  status: string;
  completedAt: string | null;
  createdAt: string;
};

type Filter = "ALL" | "PENDING" | "VALIDATED" | "FULFILLED";

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "ALL", label: "Todos" },
  { value: "PENDING", label: "Pendentes" },
  { value: "VALIDATED", label: "Validados" },
  { value: "FULFILLED", label: "Atendidos" }
];

export default function CentralPage() {
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);

  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [attendances, setAttendances] = useState<AttendanceItem[]>([]);

  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, rRes, mRes, aRes] = await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/requests"),
        fetch("/api/matches", { credentials: "include" }),
        fetch("/api/attendances", { credentials: "include" })
      ]);
      const d = await dRes.json();
      const r = await rRes.json();
      setDashboard(d.dashboard ?? null);
      setRequests(r.requests ?? []);
      if (mRes.ok) {
        const m = await mRes.json();
        setMatches(m.matches ?? []);
      }
      if (aRes.ok) {
        const a = await aRes.json();
        setAttendances(a.attendances ?? []);
      }
    } catch {
      setError("Não foi possível carregar os dados da Central.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Verifica se já existe sessão administrativa válida.
    fetch("/api/attendances", { credentials: "include" })
      .then((res) => {
        setAuthed(res.ok);
        setChecked(true);
        if (res.ok) void refresh();
      })
      .catch(() => setChecked(true));
  }, [refresh]);

  async function onLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/central/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Falha no login.");
      setAuthed(true);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setBusy(false);
    }
  }

  async function onLogout() {
    await fetch("/api/central/logout", { method: "POST", credentials: "include" });
    setAuthed(false);
    setToken("");
    setDashboard(null);
  }

  async function adminAction(path: string, method: string, body: unknown, successMsg: string) {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const res = await fetch(path, {
        method,
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Ação não concluída.");
      setNotice(successMsg);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setBusy(false);
    }
  }

  const filteredRequests = useMemo(() => {
    const term = query.trim().toLowerCase();
    return requests.filter((request) => {
      const statusOk = filter === "ALL" || request.status === filter;
      if (!statusOk) return false;
      if (!term) return true;
      return [request.category, request.item ?? "", request.region, request.shortCode ?? "", request.description]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [requests, filter, query]);

  if (!checked) {
    return (
      <div className="mx-auto max-w-md space-y-3 pt-10">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-md space-y-5 pt-4 sm:pt-10">
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-700 text-white">
            <IconLock size={22} />
          </span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">Central de Mobilização</h1>
          <p className="mt-1 text-sm text-muted">Área restrita a organizações e associações.</p>
        </div>

        {error && <Notice kind="error">{error}</Notice>}

        <Card>
          <form onSubmit={onLogin}>
            <Field
              label="Token de acesso"
              htmlFor="token"
              required
              hint="Definido pela organização na variável ADMIN_TOKEN do servidor. Validado no servidor, não no navegador."
            >
              <Input
                id="token"
                type="password"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                required
                minLength={16}
                autoComplete="current-password"
                placeholder="••••••••••••••••"
              />
            </Field>
            <Button type="submit" size="lg" loading={busy} className="w-full">
              Entrar na Central
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-muted">
          Precisa de ajuda para operar? Veja o passo a passo no <strong className="text-ink">README §3</strong>.
        </p>
      </div>
    );
  }

  const maxCat = Math.max(1, ...(dashboard?.porCategoria.map((item) => item.total) ?? [1]));
  const maxReg = Math.max(1, ...(dashboard?.porRegiao.map((item) => item.total) ?? [1]));
  const pendentes = requests.filter((request) => request.status === "PENDING");

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-2xs font-bold uppercase tracking-[0.12em] text-brand-700">
            <IconUsers size={15} /> Painel operacional
          </div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Central de Mobilização</h1>
          <p className="mt-1 text-muted">
            {pendentes.length > 0
              ? `${pendentes.length} pedido(s) aguardando a sua validação.`
              : "Nenhum pedido aguardando validação agora."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => void refresh()} loading={loading}>
            Atualizar
          </Button>
          <Button variant="ghost" onClick={onLogout} className="gap-1.5">
            <IconLogout size={16} /> Sair
          </Button>
        </div>
      </header>

      {error && <Notice kind="error">{error}</Notice>}
      {notice && <Notice kind="success">{notice}</Notice>}

      {dashboard && (
        <>
          <section aria-label="Indicadores">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat
                label="Pedidos"
                value={dashboard.totalPedidos}
                hint={`${dashboard.pedidosPendentes} pendentes · ${dashboard.pedidosValidados} validados`}
                icon={<IconHandHeart size={18} />}
              />
              <Stat
                label="Ofertas"
                value={dashboard.ofertasCadastradas}
                hint={`${dashboard.ofertasDisponiveis} disponíveis`}
                icon={<IconHeart size={18} />}
              />
              <Stat
                label="Conexões"
                value={dashboard.matchesComInteresse}
                hint={`${dashboard.matchesConfirmados} confirmadas`}
                icon={<IconCards size={18} />}
              />
              <Stat
                label="Atendimentos"
                value={dashboard.atendimentosConcluidos}
                hint="concluídos"
                icon={<IconCheck size={18} />}
              />
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-brand-300 bg-brand-50">
              <div className="flex flex-wrap items-end justify-between gap-4 p-5">
                <div>
                  <p className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-[0.1em] text-brand-800">
                    <IconChart size={14} /> Indicador principal
                  </p>
                  <p className="mt-1 text-sm font-semibold text-brand-900">{dashboard.indicadorPrincipal.rotulo}</p>
                  <p className="mt-2 text-4xl font-extrabold tracking-tight text-brand-800">
                    {dashboard.indicadorPrincipal.percentual.toFixed(1)}%
                  </p>
                  <p className="mt-1 text-sm text-brand-900/80">
                    {dashboard.indicadorPrincipal.atendimentosConcluidos} de{" "}
                    {dashboard.indicadorPrincipal.pedidosValidados} pedidos validados ·{" "}
                    <span className="text-xs">{dashboard.indicadorPrincipal.formula}</span>
                  </p>
                </div>
                <div
                  className="w-full max-w-xs"
                  role="img"
                  aria-label={`${dashboard.indicadorPrincipal.percentual.toFixed(1)} por cento dos pedidos validados foram atendidos`}
                >
                  <div className="h-3 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-brand-600 transition-all"
                      style={{ width: `${Math.min(100, dashboard.indicadorPrincipal.percentual)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-brand-900/70">
                    Calculado de dados persistidos no banco. Registros de demonstração são fictícios.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section aria-label="Distribuição de necessidades">
            <SectionHeading title="Distribuição de necessidades" description="Onde e o que a rede está pedindo." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Card title="Por categoria">
                {dashboard.porCategoria.length === 0 && <p className="text-sm text-muted">Sem registros.</p>}
                <ul className="space-y-2.5">
                  {dashboard.porCategoria.map((item) => (
                    <li key={item.categoria}>
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-ink">{item.categoria}</span>
                        <span className="tabular-nums text-muted">{item.total}</span>
                      </div>
                      <div
                        role="img"
                        aria-label={`${item.categoria}: ${item.total} pedido(s)`}
                        className="mt-1 h-2 rounded-full bg-canvas"
                      >
                        <div
                          className="h-2 rounded-full bg-brand-600"
                          style={{ width: `${(item.total / maxCat) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card title="Por região (bairro)">
                {dashboard.porRegiao.length === 0 && <p className="text-sm text-muted">Sem registros.</p>}
                <ul className="space-y-2.5">
                  {dashboard.porRegiao.map((item) => (
                    <li key={item.regiao}>
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-ink">{item.regiao}</span>
                        <span className="tabular-nums text-muted">{item.total}</span>
                      </div>
                      <div
                        role="img"
                        aria-label={`${item.regiao}: ${item.total} pedido(s)`}
                        className="mt-1 h-2 rounded-full bg-canvas"
                      >
                        <div className="h-2 rounded-full bg-brand-400" style={{ width: `${(item.total / maxReg) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </section>
        </>
      )}

      {/* ── Pedidos ─────────────────────────────────────────────────────── */}
      <section aria-label="Pedidos de ajuda">
        <SectionHeading
          title="Pedidos de ajuda"
          description="Valide, recuse ou conclua cada solicitação. A IA não decide nada aqui."
        />

        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-1" role="group" aria-label="Filtrar pedidos">
            {FILTERS.map((option) => {
              const count =
                option.value === "ALL"
                  ? requests.length
                  : requests.filter((request) => request.status === option.value).length;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={filter === option.value}
                  onClick={() => setFilter(option.value)}
                  className={cn(
                    "inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors",
                    filter === option.value
                      ? "border-brand-700 bg-brand-700 text-white"
                      : "border-line bg-white text-muted hover:border-brand-300 hover:text-ink"
                  )}
                >
                  {option.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-2xs font-bold tabular-nums",
                      filter === option.value ? "bg-white/20" : "bg-canvas"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative sm:w-64">
            <IconSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por item, bairro, código…"
              aria-label="Buscar pedidos"
              className="pl-10"
            />
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <EmptyState
            icon={<IconHandHeart size={22} />}
            title={requests.length === 0 ? "Nenhum pedido registrado ainda" : "Nenhum pedido com esse filtro"}
            description={
              requests.length === 0
                ? "Quando alguém pedir ajuda, o pedido aparece aqui para validação."
                : "Ajuste o filtro ou a busca para ver outros pedidos."
            }
          />
        ) : (
          <ul className="space-y-3">
            {filteredRequests.map((request) => (
              <li key={request.id}>
                <article className="rounded-2xl border border-line bg-surface p-4 shadow-soft sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <RequestStatusBadge status={request.status} />
                        {request.shortCode && (
                          <Badge tone="neutral" className="font-mono tracking-[0.08em]">
                            {request.shortCode}
                          </Badge>
                        )}
                      </div>
                      <h3 className="mt-2 text-lg font-bold text-ink">
                        {request.category}
                        {request.item ? ` — ${request.item}` : ""}
                        {request.quantity != null && (
                          <span className="ml-1.5 text-sm font-semibold text-muted">× {request.quantity}</span>
                        )}
                      </h3>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                        <span className="inline-flex items-center gap-1">
                          <IconPin size={13} /> {request.region}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <IconClock size={13} /> {formatDateTime(request.createdAt)}
                        </span>
                      </p>
                    </div>
                    <Link
                      href={`/pedidos/${request.shortCode ?? request.id}`}
                      className="inline-flex items-center gap-1 text-sm font-bold text-brand-800 hover:underline"
                    >
                      Abrir <IconArrowRight size={14} />
                    </Link>
                  </div>

                  <p className="mt-2 rounded-xl bg-canvas p-3 text-sm text-ink/80">{request.description}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {request.status === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            adminAction(`/api/requests/${request.id}`, "PATCH", { status: "VALIDATED" }, "Pedido validado.")
                          }
                          loading={busy}
                        >
                          <IconCheck size={16} /> Validar pedido
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            adminAction(`/api/requests/${request.id}`, "PATCH", { status: "REJECTED" }, "Pedido não validado.")
                          }
                          loading={busy}
                        >
                          Não validar
                        </Button>
                      </>
                    )}
                    {request.status === "VALIDATED" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          adminAction(
                            `/api/requests/${request.id}`,
                            "PATCH",
                            { status: "FULFILLED" },
                            "Pedido marcado como atendido."
                          )
                        }
                        loading={busy}
                      >
                        Marcar como atendido
                      </Button>
                    )}
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Matches ─────────────────────────────────────────────────────── */}
      <section aria-label="Conexões">
        <SectionHeading
          title="Conexões"
          description="Interesses registrados pelo Match Solidário — confirme apenas depois de falar com as partes."
        />
        {matches.length === 0 ? (
          <EmptyState
            icon={<IconCards size={22} />}
            title="Nenhuma conexão registrada"
            description="As sugestões aparecem quando moradores e doadores sinalizam interesse no Match."
          />
        ) : (
          <ul className="space-y-3">
            {matches.map((match) => (
              <li key={match.id}>
                <article className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
                  <div className="flex flex-wrap items-center gap-2">
                    <MatchStatusBadge status={match.status} />
                    {match.requesterInterested && <Badge tone="brand">interesse do morador</Badge>}
                    {match.providerInterested && <Badge tone="brand">interesse do doador</Badge>}
                  </div>
                  <p className="mt-2 text-sm text-ink/80">{match.compatibilityReason}</p>
                  <p className="mt-1 font-mono text-2xs text-muted">
                    pedido {match.requestId.slice(0, 8)} · oferta {match.offerId.slice(0, 8)}
                  </p>
                  {!["CONFIRMED", "REJECTED"].includes(match.status) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          adminAction(
                            `/api/matches/${match.id}`,
                            "PATCH",
                            { action: "CONFIRM" },
                            "Conexão confirmada. Atendimento criado."
                          )
                        }
                        loading={busy}
                      >
                        <IconCheck size={16} /> Confirmar conexão
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          adminAction(`/api/matches/${match.id}`, "PATCH", { action: "REJECT" }, "Conexão recusada.")
                        }
                        loading={busy}
                      >
                        Recusar
                      </Button>
                    </div>
                  )}
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Atendimentos ────────────────────────────────────────────────── */}
      <section aria-label="Atendimentos">
        <SectionHeading title="Atendimentos" description="Do início ao fim: cada entrega tem status e data." />
        {attendances.length === 0 ? (
          <EmptyState
            icon={<IconCheck size={22} />}
            title="Nenhum atendimento em andamento"
            description="Ao confirmar uma conexão, o atendimento é criado aqui automaticamente."
          />
        ) : (
          <ul className="space-y-3">
            {attendances.map((attendance) => (
              <li key={attendance.id}>
                <article className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
                  <div className="flex flex-wrap items-center gap-2">
                    <AttendanceStatusBadge status={attendance.status} />
                    <span className="text-sm text-muted">
                      criado em {formatDateTime(attendance.createdAt)}
                      {attendance.completedAt ? ` · concluído em ${formatDateTime(attendance.completedAt)}` : ""}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {attendance.status === "PENDING" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          adminAction(
                            `/api/attendances/${attendance.id}`,
                            "PATCH",
                            { status: "IN_PROGRESS" },
                            "Atendimento em andamento."
                          )
                        }
                        loading={busy}
                      >
                        Iniciar atendimento
                      </Button>
                    )}
                    {attendance.status === "IN_PROGRESS" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          adminAction(
                            `/api/attendances/${attendance.id}`,
                            "PATCH",
                            { status: "COMPLETED" },
                            "Atendimento concluído!"
                          )
                        }
                        loading={busy}
                      >
                        <IconCheck size={16} /> Concluir atendimento
                      </Button>
                    )}
                    {["PENDING", "IN_PROGRESS"].includes(attendance.status) && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          adminAction(
                            `/api/attendances/${attendance.id}`,
                            "PATCH",
                            { status: "CANCELLED" },
                            "Atendimento cancelado."
                          )
                        }
                        loading={busy}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Notice kind="info">
        Todas as ações desta Central são registradas no servidor. O token administrativo é validado em cada
        requisição — esconder botões não é proteção.
      </Notice>
    </div>
  );
}
