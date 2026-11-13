"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Card, EmptyState, Notice, SegmentedControl, Skeleton, cn } from "@/components/ui";
import { SwipeDeck, type DeckCard } from "@/components/SwipeDeck";
import {
  IconArrowRight,
  IconCards,
  IconHandHeart,
  IconHeart,
  IconList,
  IconPin,
  IconSparkle
} from "@/components/icons";
import { listLocalOffers, listLocalRequests, type LocalOffer, type LocalRequest } from "@/lib/local-records";

type Mode = "preciso" | "ajudar";

interface Suggestion {
  request: {
    id: string;
    shortCode: string | null;
    category: string;
    item: string | null;
    description: string;
    quantity: number | null;
    region: string;
  };
  offer: {
    id: string;
    category: string;
    item: string | null;
    description: string;
    quantity: number | null;
    region: string;
    availability: string | null;
    type: string;
  };
  report: { reason: string; score: number };
}

interface PickOption {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  own?: boolean;
}

function MatchInner() {
  const params = useSearchParams();
  const queryMode: Mode = params.get("mode") === "ajudar" ? "ajudar" : "preciso";

  const [mode, setMode] = useState<Mode>(queryMode);
  const [requestId, setRequestId] = useState<string | null>(params.get("requestId"));
  const [offerId, setOfferId] = useState<string | null>(params.get("offerId"));

  const [myRequests, setMyRequests] = useState<LocalRequest[]>([]);
  const [myOffers, setMyOffers] = useState<LocalOffer[]>([]);
  const [options, setOptions] = useState<PickOption[]>([]);

  const [cards, setCards] = useState<DeckCard[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingCards, setLoadingCards] = useState(false);
  const [view, setView] = useState<"deck" | "list">("deck");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selectedId = mode === "preciso" ? requestId : offerId;
  const selectedLabel = useMemo(() => {
    if (!selectedId) return null;
    return options.find((option) => option.id === selectedId) ?? null;
  }, [options, selectedId]);

  const loadOptions = useCallback(async (current: Mode) => {
    setLoadingOptions(true);
    setError(null);
    try {
      const local = current === "preciso" ? listLocalRequests() : listLocalOffers();
      if (current === "preciso") setMyRequests(local as LocalRequest[]);
      else setMyOffers(local as LocalOffer[]);

      if (current === "preciso") {
        const res = await fetch("/api/requests?status=VALIDATED");
        const data = await res.json();
        const remote: PickOption[] = (data.requests ?? []).map(
          (r: { id: string; shortCode: string | null; category: string; item: string | null; region: string }) => ({
            id: r.id,
            title: `${r.category}${r.item ? ` — ${r.item}` : ""}`,
            subtitle: r.region,
            badge: r.shortCode ?? undefined
          })
        );
        setOptions(remote);
      } else {
        const res = await fetch("/api/offers?status=AVAILABLE");
        const data = await res.json();
        const remote: PickOption[] = (data.offers ?? []).map(
          (o: { id: string; category: string; item: string | null; region: string; type: string }) => ({
            id: o.id,
            title: `${o.category}${o.item ? ` — ${o.item}` : ""}`,
            subtitle: o.region,
            badge: o.type === "VOLUNTEERING" ? "Voluntariado" : "Doação"
          })
        );
        setOptions(remote);
      }
    } catch {
      setError("Não foi possível carregar a lista agora. Tente de novo em instantes.");
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  const loadSuggestions = useCallback(async (current: Mode, id: string) => {
    setLoadingCards(true);
    setError(null);
    try {
      const query = current === "preciso" ? `requestId=${id}` : `offerId=${id}`;
      const res = await fetch(`/api/matches?${query}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erro ao carregar recomendações.");
      const suggestions: Suggestion[] = data.suggestions ?? [];
      setCards(
        suggestions.map((suggestion) =>
          current === "preciso"
            ? {
                id: suggestion.offer.id,
                title: suggestion.offer.item ?? suggestion.offer.category,
                category: suggestion.offer.category,
                description: suggestion.offer.description,
                region: suggestion.offer.region,
                quantity:
                  suggestion.offer.quantity != null
                    ? `${suggestion.offer.quantity} unidade(s)`
                    : suggestion.offer.availability ?? "a combinar",
                reason: suggestion.report.reason,
                score: suggestion.report.score,
                meta: suggestion.offer.type === "VOLUNTEERING" ? "Voluntariado" : "Doação"
              }
            : {
                id: suggestion.request.id,
                title: suggestion.request.item ?? suggestion.request.category,
                category: suggestion.request.category,
                description: suggestion.request.description,
                region: suggestion.request.region,
                quantity:
                  suggestion.request.quantity != null
                    ? `${suggestion.request.quantity} unidade(s)`
                    : "a combinar",
                reason: suggestion.report.reason,
                score: suggestion.report.score,
                meta: suggestion.request.shortCode
                  ? `Pedido ${suggestion.request.shortCode}`
                  : "Necessidade validada"
              }
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoadingCards(false);
    }
  }, []);

  useEffect(() => {
    // Sempre carregamos a lista: ela alimenta o resumo da seleção (e o "trocar").
    void loadOptions(mode);
    if (selectedId) void loadSuggestions(mode, selectedId);
  }, [mode, selectedId, loadOptions, loadSuggestions]);

  async function registerInterest(card: DeckCard) {
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          mode === "preciso"
            ? { requestId, offerId: card.id, who: "requester" }
            : { requestId: card.id, offerId, who: "provider" }
        )
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Não foi possível registrar o interesse.");
      setMessage(
        data.mutualInterest
          ? "Interesse mútuo! A organização vai confirmar esta conexão na Central de Mobilização."
          : "Interesse registrado. A organização acompanha e confirma o atendimento na Central."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    }
  }

  async function dismiss(card: DeckCard) {
    try {
      await fetch("/api/matches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          mode === "preciso"
            ? { action: "PASS", requestId, offerId: card.id, who: "requester" }
            : { action: "PASS", requestId: card.id, offerId, who: "provider" }
        )
      });
    } catch {
      /* passar é reversível: se a rede falhar, não bloqueamos a pessoa */
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setRequestId(null);
    setOfferId(null);
    setCards([]);
    setOptions([]);
    setMessage(null);
    setError(null);
  }

  const ownOptions: PickOption[] = (mode === "preciso" ? myRequests : myOffers).map((item) => ({
    id: item.id,
    title: `${item.category}${item.item ? ` — ${item.item}` : ""}`,
    subtitle: item.region,
    badge: "shortCode" in item && item.shortCode ? item.shortCode : "Meu registro",
    own: true
  }));

  const suggestionsLabel =
    mode === "preciso" ? "Ofertas compatíveis com o seu pedido" : "Necessidades compatíveis com a sua oferta";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <p className="text-2xs font-bold uppercase tracking-[0.12em] text-brand-700">Módulo C</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Match Solidário</h1>
        <p className="max-w-2xl text-muted">
          Um único motor para os dois lados: quem precisa vê ofertas, quem doa vê necessidades. A compatibilidade é
          decidida por regras objetivas (categoria, item, quantidade e região) e vem explicada em cada cartão.
        </p>
      </header>

      <SegmentedControl
        label="Escolha o seu lado"
        value={mode}
        onChange={switchMode}
        options={[
          {
            value: "preciso",
            label: "Preciso de ajuda",
            hint: "Ver ofertas para o meu pedido",
            icon: <IconHandHeart size={20} />
          },
          {
            value: "ajudar",
            label: "Quero ajudar",
            hint: "Ver necessidades para a minha oferta",
            icon: <IconHeart size={20} />
          }
        ]}
      />

      {error && <Notice kind="error" title="Algo deu errado">{error}</Notice>}
      {message && (
        <Notice kind="success" title="Interesse registrado">
          {message}
        </Notice>
      )}

      {!selectedId && (
        <Card
          eyebrow="Passo 1"
          title={mode === "preciso" ? "Sobre qual pedido você quer ver ofertas?" : "Sobre qual oferta você quer ver necessidades?"}
        >
          {loadingOptions ? (
            <div className="space-y-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : (
            <div className="space-y-5">
              {ownOptions.length > 0 && (
                <div>
                  <p className="mb-2 text-2xs font-bold uppercase tracking-[0.1em] text-muted">Seus registros</p>
                  <ul className="space-y-2">
                    {ownOptions.map((option) => (
                      <li key={option.id}>
                        <PickRow
                          option={option}
                          onSelect={() => (mode === "preciso" ? setRequestId(option.id) : setOfferId(option.id))}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <p className="mb-2 text-2xs font-bold uppercase tracking-[0.1em] text-muted">
                  {ownOptions.length > 0
                    ? "Outros registros na rede"
                    : mode === "preciso"
                      ? "Pedidos validados pela organização"
                      : "Ofertas disponíveis"}
                </p>
                {options.length === 0 ? (
                  <EmptyState
                    icon={mode === "preciso" ? <IconHandHeart size={22} /> : <IconHeart size={22} />}
                    title={
                      mode === "preciso"
                        ? "Nenhum pedido validado ainda"
                        : "Nenhuma oferta disponível ainda"
                    }
                    description={
                      mode === "preciso"
                        ? "Registre o seu pedido: assim que a organização validar, as ofertas compatíveis aparecem aqui."
                        : "Cadastre o que você pode doar ou o tempo que pode oferecer para começar."
                    }
                    action={
                      <Link
                        href={mode === "preciso" ? "/solicitar-ajuda" : "/oferecer-ajuda"}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-bold text-white shadow-soft hover:bg-brand-800"
                      >
                        {mode === "preciso" ? "Solicitar ajuda" : "Oferecer ajuda"}
                        <IconArrowRight size={16} />
                      </Link>
                    }
                  />
                ) : (
                  <ul className="space-y-2">
                    {options.slice(0, 12).map((option) => (
                      <li key={option.id}>
                        <PickRow
                          option={option}
                          onSelect={() => (mode === "preciso" ? setRequestId(option.id) : setOfferId(option.id))}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {selectedId && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-soft">
            <div className="min-w-0">
              <p className="text-2xs font-bold uppercase tracking-[0.1em] text-muted">
                {mode === "preciso" ? "Pedido selecionado" : "Oferta selecionada"}
              </p>
              <p className="truncate font-bold text-ink">
                {selectedLabel ? `${selectedLabel.title} · ${selectedLabel.subtitle}` : "Carregando..."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-xl border border-line p-1" role="group" aria-label="Modo de visualização">
                <button
                  type="button"
                  aria-pressed={view === "deck"}
                  onClick={() => setView("deck")}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    view === "deck" ? "bg-brand-700 text-white" : "text-muted hover:bg-canvas"
                  )}
                  title="Ver como cartões"
                >
                  <IconCards size={17} />
                  <span className="sr-only">Ver como cartões</span>
                </button>
                <button
                  type="button"
                  aria-pressed={view === "list"}
                  onClick={() => setView("list")}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    view === "list" ? "bg-brand-700 text-white" : "text-muted hover:bg-canvas"
                  )}
                  title="Ver como lista"
                >
                  <IconList size={17} />
                  <span className="sr-only">Ver como lista</span>
                </button>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setRequestId(null);
                  setOfferId(null);
                  setCards([]);
                  setMessage(null);
                  void loadOptions(mode);
                }}
              >
                Trocar
              </Button>
            </div>
          </div>

          <h2 className="text-lg font-bold text-ink">
            {suggestionsLabel}
            {cards.length > 0 && <span className="ml-2 text-sm font-semibold text-muted">{cards.length} resultado(s)</span>}
          </h2>

          {loadingCards ? (
            <Card>
              <div className="space-y-3">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-20" />
                <Skeleton className="h-12 w-2/3" />
              </div>
            </Card>
          ) : (
            <SwipeDeck
              cards={cards}
              view={view}
              onInterest={registerInterest}
              onPass={dismiss}
              interestLabel="Tenho interesse"
              passLabel="Passar"
              emptyMessage="Nenhuma compatibilidade por aqui ainda"
              emptyHint="Novas ofertas e pedidos entram o tempo todo. Volte em instantes ou ajuste o item/quantidade do seu registro."
            />
          )}

          <p className="flex items-start gap-2 rounded-xl border border-line bg-surface p-3 text-xs text-muted">
            <IconSparkle size={14} className="mt-0.5 shrink-0 text-brand-600" />
            Compatibilidade calculada por regras objetivas. Endereços e contatos nunca aparecem nos cartões — a
            aproximação acontece pela organização, na Central.
          </p>
        </>
      )}

      <p className="flex items-center gap-2 text-xs text-muted">
        <IconPin size={14} /> A ordenação prioriza maior pontuação de compatibilidade.
      </p>
    </div>
  );
}

function PickRow({ option, onSelect }: { option: PickOption; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3 text-left transition-colors hover:border-brand-300 hover:bg-brand-50"
    >
      <span className="min-w-0">
        <span className="block truncate font-semibold text-ink">{option.title}</span>
        <span className="block truncate text-sm text-muted">{option.subtitle}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {option.badge && (
          <span className="rounded-full border border-line bg-canvas px-2 py-0.5 text-2xs font-bold uppercase tracking-[0.06em] text-muted">
            {option.badge}
          </span>
        )}
        <IconArrowRight size={16} className="text-brand-700" />
      </span>
    </button>
  );
}

export default function MatchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl space-y-4">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-24" />
        </div>
      }
    >
      <MatchInner />
    </Suspense>
  );
}
