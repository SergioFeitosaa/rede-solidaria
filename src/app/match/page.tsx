"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Card, Notice, Select, Badge } from "@/components/ui";
import { SwipeDeck, type DeckCard } from "@/components/SwipeDeck";

type Mode = "preciso" | "ajudar";

interface Suggestion {
  request: { id: string; category: string; item: string | null; description: string; quantity: number | null; region: string };
  offer: { id: string; category: string; item: string | null; description: string; quantity: number | null; region: string; availability: string | null; type: string };
  report: { reason: string; score: number };
}

function MatchInner() {
  const params = useSearchParams();
  const queryMode = params.get("mode") === "ajudar" ? "ajudar" : "preciso";
  const queryRequestId = params.get("requestId");
  const queryOfferId = params.get("offerId");

  const [mode, setMode] = useState<Mode>(queryMode);
  const [requestId, setRequestId] = useState<string | null>(queryRequestId);
  const [offerId, setOfferId] = useState<string | null>(queryOfferId);
  const [options, setOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [cards, setCards] = useState<DeckCard[]>([]);
  const [raw, setRaw] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // lista de pedidos (modo preciso) ou ofertas (modo ajudar) para escolher
  const loadOptions = useCallback(async (m: Mode) => {
    setLoading(true);
    setError(null);
    try {
      if (m === "preciso") {
        const res = await fetch("/api/requests?status=VALIDATED");
        const data = await res.json();
        setOptions(
          (data.requests ?? []).map((r: { id: string; category: string; item: string | null; region: string }) => ({
            id: r.id,
            label: `${r.category}${r.item ? ` — ${r.item}` : ""} (${r.region})`
          }))
        );
      } else {
        const res = await fetch("/api/offers?status=AVAILABLE");
        const data = await res.json();
        setOptions(
          (data.offers ?? []).map((o: { id: string; category: string; item: string | null; region: string }) => ({
            id: o.id,
            label: `${o.category}${o.item ? ` — ${o.item}` : ""} (${o.region})`
          }))
        );
      }
    } catch {
      setError("Não foi possível carregar a lista.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSuggestions = useCallback(async (m: Mode, id: string) => {
    setLoading(true);
    setError(null);
    try {
      const query = m === "preciso" ? `requestId=${id}` : `offerId=${id}`;
      const res = await fetch(`/api/matches?${query}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erro ao carregar recomendações.");
      const suggestions: Suggestion[] = data.suggestions ?? [];
      setRaw(suggestions);
      setCards(
        suggestions.map((s) =>
          m === "preciso"
            ? {
                id: s.offer.id,
                title: s.offer.item ?? s.offer.category,
                category: s.offer.category,
                description: s.offer.description,
                region: s.offer.region,
                quantity: s.offer.quantity != null ? `${s.offer.quantity} unidade(s)` : (s.offer.availability ?? "a combinar"),
                reason: s.report.reason,
                meta: s.offer.type === "VOLUNTEERING" ? "Voluntariado" : "Doação"
              }
            : {
                id: s.request.id,
                title: s.request.item ?? s.request.category,
                category: s.request.category,
                description: s.request.description,
                region: s.request.region,
                quantity: s.request.quantity != null ? `${s.request.quantity} unidade(s)` : "a combinar",
                reason: s.report.reason,
                meta: "Necessidade validada"
              }
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMessage(null);
    if (mode === "preciso" && requestId) loadSuggestions("preciso", requestId);
    else if (mode === "ajudar" && offerId) loadSuggestions("ajudar", offerId);
    else loadOptions(mode);
  }, [mode, requestId, offerId, loadOptions, loadSuggestions]);

  async function registerInterest(card: DeckCard) {
    try {
      const payload =
        mode === "preciso"
          ? { requestId, offerId: card.id, who: "requester" }
          : { requestId: card.id, offerId, who: "provider" };
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Não foi possível registrar o interesse.");
      setMessage(
        data.mutualInterest
          ? "💛 Interesse mútuo! A organização vai confirmar esta conexão na Central de Mobilização."
          : "Interesse registrado. A organização acompanha e confirma o atendimento na Central."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    }
  }

  function switchMode(m: Mode) {
    setMode(m);
    setRequestId(null);
    setOfferId(null);
    setCards([]);
    setRaw([]);
    setMessage(null);
    setError(null);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-ink">Match Solidário</h1>
        <p className="mt-2 text-ink/70">
          Descubra conexões compatíveis. Arraste o cartão ou use os botões:{" "}
          <strong>direita = interesse</strong>, <strong>esquerda = passar</strong>. O interesse ajuda a
          organização a confirmar o atendimento — não é uma doação concluída.
        </p>
      </header>

      <div role="group" aria-label="Escolha o modo" className="grid grid-cols-2 gap-3">
        <button
          type="button"
          aria-pressed={mode === "preciso"}
          onClick={() => switchMode("preciso")}
          className={`min-h-[56px] rounded-2xl border-2 p-4 text-left text-base font-bold ${
            mode === "preciso" ? "border-brand-700 bg-brand-700 text-white" : "border-ink/15 bg-white text-ink hover:bg-brand-50"
          }`}
        >
          Preciso de ajuda
          <span className={`mt-1 block text-sm font-normal ${mode === "preciso" ? "text-brand-50" : "text-ink/60"}`}>
            Vejo ofertas compatíveis
          </span>
        </button>
        <button
          type="button"
          aria-pressed={mode === "ajudar"}
          onClick={() => switchMode("ajudar")}
          className={`min-h-[56px] rounded-2xl border-2 p-4 text-left text-base font-bold ${
            mode === "ajudar" ? "border-brand-700 bg-brand-700 text-white" : "border-ink/15 bg-white text-ink hover:bg-brand-50"
          }`}
        >
          Quero ajudar
          <span className={`mt-1 block text-sm font-normal ${mode === "ajudar" ? "text-brand-50" : "text-ink/60"}`}>
            Vejo necessidades compatíveis
          </span>
        </button>
      </div>

      {error && <Notice kind="error">{error}</Notice>}
      {message && <Notice kind="success">{message}</Notice>}

      {((mode === "preciso" && !requestId) || (mode === "ajudar" && !offerId)) && (
        <Card title={mode === "preciso" ? "Sobre qual pedido você quer ver ofertas?" : "Sobre qual oferta você quer ver necessidades?"}>
          {loading ? (
            <p>Carregando...</p>
          ) : options.length === 0 ? (
            <div className="space-y-3">
              <p className="text-ink/70">
                {mode === "preciso"
                  ? "Nenhum pedido validado no momento. Registre o seu pedido — depois que a organização validar, as ofertas aparecem aqui."
                  : "Nenhuma oferta disponível no momento. Cadastre a sua oferta para começar."}
              </p>
              <Link
                href={mode === "preciso" ? "/solicitar-ajuda" : "/oferecer-ajuda"}
                className="inline-flex min-h-[48px] items-center rounded-xl bg-brand-700 px-6 py-3 font-semibold text-white hover:bg-brand-800"
              >
                {mode === "preciso" ? "Solicitar ajuda" : "Oferecer ajuda"}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <label htmlFor="pick" className="block font-semibold text-ink">
                Selecione na lista:
              </label>
              <Select
                id="pick"
                defaultValue=""
                onChange={(e) => {
                  if (!e.target.value) return;
                  if (mode === "preciso") setRequestId(e.target.value);
                  else setOfferId(e.target.value);
                }}
              >
                <option value="" disabled>
                  Escolha uma opção...
                </option>
                {options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </Select>
              <p className="text-sm text-ink/60">
                Dica: ao final do cadastro, o botão “ver compatíveis” já abre o baralho direto.
              </p>
            </div>
          )}
        </Card>
      )}

      {(requestId || offerId) && (
        <>
          <div className="flex items-center gap-2">
            <Badge tone="brand">{mode === "preciso" ? "Ofertas para o seu pedido" : "Necessidades para a sua oferta"}</Badge>
            <Button
              variant="ghost"
              onClick={() => {
                setRequestId(null);
                setOfferId(null);
                setCards([]);
                setMessage(null);
              }}
            >
              trocar seleção
            </Button>
          </div>
          {loading ? (
            <p>Buscando compatibilidades...</p>
          ) : (
            <SwipeDeck
              cards={cards}
              interestLabel="Tenho interesse"
              passLabel="Passar"
              onInterest={registerInterest}
              onPass={() => setMessage(null)}
              emptyMessage="Nenhuma compatibilidade encontrada por enquanto. Novas ofertas e pedidos entram o tempo todo."
            />
          )}
          {raw.length > 0 && (
            <p className="text-xs text-ink/60">
              Compatibilidades calculadas por regras objetivas (categoria, item, quantidade e região).
              Endereços e contatos nunca aparecem nos cartões.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default function MatchPage() {
  return (
    <Suspense fallback={<p>Carregando...</p>}>
      <MatchInner />
    </Suspense>
  );
}
