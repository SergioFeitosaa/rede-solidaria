"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card, Field, Input, Notice, Stat, Badge } from "@/components/ui";
import { RequestStatusBadge, MatchStatusBadge, AttendanceStatusBadge } from "@/components/StatusBadge";
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

export default function CentralPage() {
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [attendances, setAttendances] = useState<AttendanceItem[]>([]);

  const refresh = useCallback(async () => {
    try {
      const [dRes, rRes, mRes, aRes] = await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/requests"),
        fetch("/api/matches"),
        fetch("/api/attendances", { credentials: "include" })
      ]);
      const d = await dRes.json();
      const r = await rRes.json();
      const m = await mRes.json();
      setDashboard(d.dashboard ?? null);
      setRequests(r.requests ?? []);
      setMatches(m.matches ?? []);
      if (aRes.ok) {
        const a = await aRes.json();
        setAttendances(a.attendances ?? []);
      }
    } catch {
      setError("Não foi possível carregar os dados da Central.");
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

  if (!checked) {
    return <p>Verificando acesso...</p>;
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-md space-y-5">
        <h1 className="text-3xl font-bold text-ink">Central de Mobilização</h1>
        <Notice kind="info">
          Área restrita a organizações e associações. O token é definido na variável de ambiente
          <code className="mx-1 rounded bg-sand-100 px-1">ADMIN_TOKEN</code> do servidor.
        </Notice>
        {error && <Notice kind="error">{error}</Notice>}
        <Card>
          <form onSubmit={onLogin}>
            <Field label="Token de acesso" htmlFor="token" required>
              <Input
                id="token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                minLength={16}
                autoComplete="current-password"
              />
            </Field>
            <Button type="submit" loading={busy} className="w-full">
              Entrar na Central
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  const maxCat = Math.max(1, ...(dashboard?.porCategoria.map((c) => c.total) ?? [1]));
  const maxReg = Math.max(1, ...(dashboard?.porRegiao.map((r) => r.total) ?? [1]));

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-ink">Central de Mobilização</h1>
          <p className="mt-1 text-ink/70">Valide pedidos, confirme conexões e acompanhe atendimentos.</p>
        </div>
        <Button variant="secondary" onClick={onLogout}>
          Sair
        </Button>
      </header>

      {error && <Notice kind="error">{error}</Notice>}
      {notice && <Notice kind="success">{notice}</Notice>}

      {dashboard && (
        <>
          <section aria-label="Indicadores">
            <h2 className="mb-3 text-2xl font-bold text-ink">Indicadores</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <Stat label="Pedidos" value={dashboard.totalPedidos} hint={`${dashboard.pedidosPendentes} pendentes`} />
              <Stat label="Validados" value={dashboard.pedidosValidados} />
              <Stat label="Ofertas" value={dashboard.ofertasCadastradas} hint={`${dashboard.ofertasDisponiveis} disponíveis`} />
              <Stat label="Matches com interesse" value={dashboard.matchesComInteresse} hint={`${dashboard.matchesConfirmados} confirmados`} />
              <Stat label="Atendimentos concluídos" value={dashboard.atendimentosConcluidos} />
            </div>

            <div className="mt-4 rounded-2xl border-2 border-brand-300 bg-brand-50 p-5">
              <h3 className="text-lg font-bold text-brand-900">{dashboard.indicadorPrincipal.rotulo}</h3>
              <p className="mt-2 text-4xl font-bold text-brand-800">
                {dashboard.indicadorPrincipal.percentual.toFixed(1)}%
              </p>
              <p className="mt-1 text-sm text-brand-900">
                {dashboard.indicadorPrincipal.atendimentosConcluidos} de{" "}
                {dashboard.indicadorPrincipal.pedidosValidados} pedidos validados · fórmula:{" "}
                {dashboard.indicadorPrincipal.formula}
              </p>
              <p className="mt-1 text-xs text-brand-900/80">
                Calculado de dados persistidos no banco. Registros de demonstração são simulados.
              </p>
            </div>
          </section>

          <section aria-label="Distribuição de necessidades">
            <h2 className="mb-3 text-2xl font-bold text-ink">Distribuição de necessidades</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card title="Por categoria">
                {dashboard.porCategoria.length === 0 && <p className="text-ink/60">Sem registros.</p>}
                <ul className="space-y-2">
                  {dashboard.porCategoria.map((c) => (
                    <li key={c.categoria}>
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-ink">{c.categoria}</span>
                        <span className="text-ink/60">{c.total}</span>
                      </div>
                      <div
                        role="img"
                        aria-label={`${c.categoria}: ${c.total} pedido(s)`}
                        className="mt-1 h-3 rounded-full bg-sand-100"
                      >
                        <div className="h-3 rounded-full bg-brand-600" style={{ width: `${(c.total / maxCat) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card title="Por região (bairro)">
                {dashboard.porRegiao.length === 0 && <p className="text-ink/60">Sem registros.</p>}
                <ul className="space-y-2">
                  {dashboard.porRegiao.map((r) => (
                    <li key={r.regiao}>
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-ink">{r.regiao}</span>
                        <span className="text-ink/60">{r.total}</span>
                      </div>
                      <div
                        role="img"
                        aria-label={`${r.regiao}: ${r.total} pedido(s)`}
                        className="mt-1 h-3 rounded-full bg-sand-100"
                      >
                        <div className="h-3 rounded-full bg-brand-400" style={{ width: `${(r.total / maxReg) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </section>
        </>
      )}

      <section aria-label="Pedidos">
        <h2 className="mb-3 text-2xl font-bold text-ink">Pedidos de ajuda</h2>
        {requests.length === 0 && <p className="text-ink/60">Nenhum pedido registrado ainda.</p>}
        <ul className="space-y-3">
          {requests.map((r) => (
            <li key={r.id} className="rounded-2xl border border-ink/10 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <RequestStatusBadge status={r.status} />
                <strong className="text-ink">
                  {r.category}
                  {r.item ? ` — ${r.item}` : ""}
                </strong>
                <span className="text-sm text-ink/60">
                  {r.quantity != null ? `qtd ${r.quantity} · ` : ""}
                  {r.region} · {formatDateTime(r.createdAt)}
                </span>
              </div>
              <p className="mt-2 text-sm text-ink/70">{r.description}</p>
              {r.status === "PENDING" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    onClick={() => adminAction(`/api/requests/${r.id}`, "PATCH", { status: "VALIDATED" }, "Pedido validado.")}
                    loading={busy}
                  >
                    Validar pedido
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => adminAction(`/api/requests/${r.id}`, "PATCH", { status: "REJECTED" }, "Pedido não validado.")}
                    loading={busy}
                  >
                    Não validar
                  </Button>
                </div>
              )}
              {r.status === "VALIDATED" && (
                <div className="mt-3">
                  <Button
                    variant="secondary"
                    onClick={() => adminAction(`/api/requests/${r.id}`, "PATCH", { status: "FULFILLED" }, "Pedido marcado como atendido.")}
                    loading={busy}
                  >
                    Marcar como atendido
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Matches">
        <h2 className="mb-3 text-2xl font-bold text-ink">Matches e conexões</h2>
        {matches.length === 0 && <p className="text-ink/60">Nenhum match registrado ainda.</p>}
        <ul className="space-y-3">
          {matches.map((m) => (
            <li key={m.id} className="rounded-2xl border border-ink/10 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <MatchStatusBadge status={m.status} />
                {m.requesterInterested && <Badge tone="brand">interesse do morador</Badge>}
                {m.providerInterested && <Badge tone="brand">interesse do doador</Badge>}
              </div>
              <p className="mt-2 text-sm text-ink/70">{m.compatibilityReason}</p>
              <p className="mt-1 text-xs text-ink/50">Pedido {m.requestId} · Oferta {m.offerId}</p>
              {!["CONFIRMED", "REJECTED"].includes(m.status) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    onClick={() => adminAction(`/api/matches/${m.id}`, "PATCH", { action: "CONFIRM" }, "Match confirmado. Atendimento criado.")}
                    loading={busy}
                  >
                    Confirmar conexão
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => adminAction(`/api/matches/${m.id}`, "PATCH", { action: "REJECT" }, "Match recusado.")}
                    loading={busy}
                  >
                    Recusar
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Atendimentos">
        <h2 className="mb-3 text-2xl font-bold text-ink">Atendimentos</h2>
        {attendances.length === 0 && <p className="text-ink/60">Nenhum atendimento registrado ainda.</p>}
        <ul className="space-y-3">
          {attendances.map((a) => (
            <li key={a.id} className="rounded-2xl border border-ink/10 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <AttendanceStatusBadge status={a.status} />
                <span className="text-sm text-ink/60">
                  criado em {formatDateTime(a.createdAt)}
                  {a.completedAt ? ` · concluído em ${formatDateTime(a.completedAt)}` : ""}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {a.status === "PENDING" && (
                  <Button
                    onClick={() => adminAction(`/api/attendances/${a.id}`, "PATCH", { status: "IN_PROGRESS" }, "Atendimento em andamento.")}
                    loading={busy}
                  >
                    Iniciar atendimento
                  </Button>
                )}
                {a.status === "IN_PROGRESS" && (
                  <Button
                    onClick={() => adminAction(`/api/attendances/${a.id}`, "PATCH", { status: "COMPLETED" }, "Atendimento concluído!")}
                    loading={busy}
                  >
                    Concluir atendimento
                  </Button>
                )}
                {["PENDING", "IN_PROGRESS"].includes(a.status) && (
                  <Button
                    variant="secondary"
                    onClick={() => adminAction(`/api/attendances/${a.id}`, "PATCH", { status: "CANCELLED" }, "Atendimento cancelado.")}
                    loading={busy}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
