"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, EmptyState, cn } from "./ui";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBox,
  IconCards,
  IconCheck,
  IconPin,
  IconSparkle,
  IconUndo,
  IconX
} from "./icons";

/**
 * Baralho do Match Solidário.
 *
 * - Arraste o cartão (toque ou mouse) para a direita = interesse, esquerda = passar.
 * - Botões grandes equivalentes: o gesto é um atalho, nunca a única forma.
 * - Setas ← → no teclado quando o baralho está focado.
 * - "Desfazer" devolve a última decisão ao baralho (erro de gesto tem conserto).
 * - Região aria-live anuncia cada ação: não dependemos de cor nem de movimento.
 * - O interesse NÃO é doação concluída: a organização confirma na Central.
 */

export interface DeckCard {
  id: string;
  title: string;
  category: string;
  description: string;
  region: string;
  quantity: string;
  reason: string;
  meta?: string;
  score?: number;
}

type Direction = "right" | "left";

const SWIPE_THRESHOLD = 96;

export function SwipeDeck({
  cards,
  interestLabel = "Tenho interesse",
  passLabel = "Passar",
  onInterest,
  onPass,
  onUndo,
  emptyMessage = "Nenhuma recomendação por enquanto.",
  emptyHint,
  view = "deck"
}: {
  cards: DeckCard[];
  interestLabel?: string;
  passLabel?: string;
  onInterest: (card: DeckCard) => void;
  onPass: (card: DeckCard) => void;
  onUndo?: (card: DeckCard, direction: Direction) => void;
  emptyMessage?: string;
  emptyHint?: string;
  view?: "deck" | "list";
}) {
  const [index, setIndex] = useState(0);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [leaving, setLeaving] = useState<Direction | null>(null);
  const [history, setHistory] = useState<Array<{ card: DeckCard; direction: Direction }>>([]);
  const [announcement, setAnnouncement] = useState("");
  const startX = useRef<number | null>(null);
  const deckRef = useRef<HTMLDivElement>(null);

  const card = cards[index];

  useEffect(() => {
    setIndex(0);
    setOffset(0);
    setHistory([]);
    setLeaving(null);
  }, [cards]);

  const decide = useCallback(
    (direction: Direction) => {
      if (!card || leaving) return;
      const active = card;
      setLeaving(direction);
      setOffset(direction === "right" ? 460 : -460);
      if (direction === "right") onInterest(active);
      else onPass(active);
      setAnnouncement(
        direction === "right"
          ? `Interesse registrado em ${active.title}.`
          : `Cartão dispensado: ${active.title}.`
      );
      window.setTimeout(() => {
        setHistory((h) => [...h, { card: active, direction }]);
        setIndex((i) => i + 1);
        setOffset(0);
        setLeaving(null);
      }, 190);
    },
    [card, leaving, onInterest, onPass]
  );

  function undo() {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setIndex((i) => Math.max(0, i - 1));
    setOffset(0);
    setLeaving(null);
    setAnnouncement(`Ação desfeita: ${last.card.title} voltou ao baralho.`);
    onUndo?.(last.card, last.direction);
  }

  if (cards.length === 0) {
    return <EmptyState icon={<IconCards size={22} />} title={emptyMessage} description={emptyHint} />;
  }

  if (view === "list") {
    return (
      <div className="space-y-3">
        {cards.map((item) => (
          <article key={item.id} className="rounded-2xl border border-line bg-surface p-4 shadow-soft sm:p-5">
            <DeckCardBody card={item} compact />
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button variant="secondary" onClick={() => onPass(item)} className="flex-1">
                <IconX size={16} /> {passLabel}
              </Button>
              <Button onClick={() => onInterest(item)} className="flex-1">
                <IconCheck size={16} /> {interestLabel}
              </Button>
            </div>
          </article>
        ))}
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="space-y-3">
        <EmptyState
          icon={<IconCheck size={22} />}
          title="Você viu todos os cartões."
          description="Os interesses já estão com a organização, que confirma as conexões na Central de Mobilização."
          action={
            <Button variant="secondary" onClick={() => setIndex(0)}>
              Rever os cartões
            </Button>
          }
        />
      </div>
    );
  }

  const rotation = Math.max(-14, Math.min(14, offset / 22));
  const interestOpacity = Math.min(1, Math.max(0, offset / SWIPE_THRESHOLD));
  const passOpacity = Math.min(1, Math.max(0, -offset / SWIPE_THRESHOLD));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
          Cartão {Math.min(index + 1, cards.length)} de {cards.length}
        </p>
        <div className="flex items-center gap-2">
          <div
            className="h-1.5 w-24 overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={cards.length}
            aria-valuenow={index}
            aria-label="Progresso do baralho"
          >
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-300"
              style={{ width: `${(index / cards.length) * 100}%` }}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={undo}
            disabled={history.length === 0}
            className="gap-1.5"
          >
            <IconUndo size={15} /> Desfazer
          </Button>
        </div>
      </div>

      <div className="relative">
        {/* Cartão de trás: dá a sensação de baralho, não de formulário */}
        {cards[index + 1] && (
          <div
            aria-hidden="true"
            className="absolute inset-x-3 top-2 h-full rounded-2xl border border-line bg-surface/80"
            style={{ transform: "scale(0.97) translateY(6px)" }}
          />
        )}

        <div
          ref={deckRef}
          tabIndex={0}
          role="group"
          aria-label={`Cartão ${index + 1} de ${cards.length}: ${card.title}. Use as setas para a esquerda e direita.`}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") {
              event.preventDefault();
              decide("right");
            } else if (event.key === "ArrowLeft") {
              event.preventDefault();
              decide("left");
            }
          }}
          onPointerDown={(event) => {
            if (leaving) return;
            startX.current = event.clientX;
            setDragging(true);
            event.currentTarget.setPointerCapture?.(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (startX.current == null) return;
            setOffset(event.clientX - startX.current);
          }}
          onPointerUp={() => {
            if (startX.current == null) return;
            startX.current = null;
            setDragging(false);
            if (offset > SWIPE_THRESHOLD) decide("right");
            else if (offset < -SWIPE_THRESHOLD) decide("left");
            else setOffset(0);
          }}
          onPointerCancel={() => {
            startX.current = null;
            setDragging(false);
            setOffset(0);
          }}
          className={cn(
            "deck-card relative cursor-grab rounded-2xl border-2 border-line bg-surface p-5 shadow-deck outline-none sm:p-6",
            dragging && "cursor-grabbing",
            !dragging && !leaving && "transition-[transform,opacity] duration-200 ease-out"
          )}
          style={{
            transform: `translateX(${offset}px) rotate(${rotation}deg)`,
            opacity: leaving ? 0 : 1,
            transitionProperty: dragging ? "none" : "transform, opacity"
          }}
        >
          {/* Overlays de intenção aparecem enquanto arrasta */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-2xl border-4 border-brand-500 bg-brand-50/40"
            style={{ opacity: interestOpacity }}
          >
            <span className="absolute left-4 top-4 rotate-[-8deg] rounded-lg border-2 border-brand-600 px-2 py-1 text-2xs font-extrabold uppercase tracking-widest text-brand-700">
              {interestLabel}
            </span>
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-2xl border-4 border-ink/40 bg-ink/5"
            style={{ opacity: passOpacity }}
          >
            <span className="absolute right-4 top-4 rotate-[8deg] rounded-lg border-2 border-ink/50 px-2 py-1 text-2xs font-extrabold uppercase tracking-widest text-ink/70">
              {passLabel}
            </span>
          </div>

          <DeckCardBody card={card} />
        </div>
      </div>

      <div className="flex items-stretch gap-2.5">
        <Button
          variant="secondary"
          size="lg"
          onClick={() => decide("left")}
          className="flex-1"
          aria-label={`${passLabel} (seta para a esquerda)`}
        >
          <IconArrowLeft size={18} />
          {passLabel}
        </Button>
        <Button
          size="lg"
          onClick={() => decide("right")}
          className="flex-1"
          aria-label={`${interestLabel} (seta para a direita)`}
        >
          {interestLabel}
          <IconArrowRight size={18} />
        </Button>
      </div>

      <p className="text-center text-xs text-muted">
        Arraste o cartão ou use os botões. ← passar · interesse →
      </p>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}

function DeckCardBody({ card, compact = false }: { card: DeckCard; compact?: boolean }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-brand-100 px-2.5 py-1 text-2xs font-bold uppercase tracking-[0.08em] text-brand-900">
          {card.category}
        </span>
        {card.meta && (
          <span className="rounded-full border border-line bg-canvas px-2.5 py-1 text-2xs font-semibold text-muted">
            {card.meta}
          </span>
        )}
        {typeof card.score === "number" && (
          <span className="ml-auto text-2xs font-bold uppercase tracking-[0.08em] text-brand-700">
            {card.score} pts de compatibilidade
          </span>
        )}
      </div>

      <h3 className={cn("mt-3 font-extrabold tracking-tight text-ink", compact ? "text-lg" : "text-2xl")}>
        {card.title}
      </h3>
      <p className={cn("mt-1.5 text-muted", compact ? "line-clamp-2 text-sm" : "text-base")}>{card.description}</p>

      <dl className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-xl bg-canvas p-3">
          <dt className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-[0.08em] text-muted">
            <IconPin size={13} /> Região
          </dt>
          <dd className="mt-1 text-sm font-semibold text-ink">{card.region}</dd>
        </div>
        <div className="rounded-xl bg-canvas p-3">
          <dt className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-[0.08em] text-muted">
            <IconBox size={13} /> Quantidade
          </dt>
          <dd className="mt-1 text-sm font-semibold text-ink">{card.quantity}</dd>
        </div>
      </dl>

      <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50 p-3">
        <p className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-[0.08em] text-brand-800">
          <IconSparkle size={13} /> Por que combina
        </p>
        <p className="mt-1 text-sm leading-relaxed text-brand-900">{card.reason}</p>
      </div>
    </div>
  );
}
