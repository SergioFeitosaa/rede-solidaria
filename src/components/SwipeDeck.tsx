"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Notice } from "./ui";

/**
 * Baralho de cartões do Match Solidário.
 * - Swipe (toque) para a direita = interesse; para a esquerda = passar.
 * - Botões grandes equivalentes (obrigatório: acessibilidade por teclado e uso sem gestos).
 * - Setas ← → quando o baralho está focado.
 * - Região aria-live anuncia cada ação (não depende de cor nem de gesto).
 * - O Swipe NÃO representa doação concluída — só registra interesse.
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
}

export function SwipeDeck({
  cards,
  interestLabel = "Tenho interesse",
  passLabel = "Passar",
  onInterest,
  onPass,
  emptyMessage = "Nenhuma recomendação por enquanto."
}: {
  cards: DeckCard[];
  interestLabel?: string;
  passLabel?: string;
  onInterest: (card: DeckCard) => void;
  onPass: (card: DeckCard) => void;
  emptyMessage?: string;
}) {
  const [index, setIndex] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const touchStart = useRef<number | null>(null);
  const deckRef = useRef<HTMLDivElement>(null);

  const card = cards[index];

  function advance() {
    setIndex((i) => i + 1);
  }

  function handleInterest() {
    if (!card) return;
    onInterest(card);
    setAnnouncement(`Interesse registrado em: ${card.title}.`);
    advance();
  }

  function handlePass() {
    if (!card) return;
    onPass(card);
    setAnnouncement(`Cartão dispensado: ${card.title}.`);
    advance();
  }

  useEffect(() => {
    if (cards.length > 0 && index === 0) {
      deckRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length]);

  if (cards.length === 0) {
    return <Notice kind="info">{emptyMessage}</Notice>;
  }

  if (!card) {
    return (
      <Notice kind="success">
        <p className="font-semibold">Você viu todos os cartões disponíveis. ✓</p>
        <p className="mt-1">
          Registre interesses para que a organização consiga confirmar os atendimentos na Central de
          Mobilização.
        </p>
      </Notice>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink/60">
        Cartão {index + 1} de {cards.length}. Use os botões abaixo — ou as setas ← → com o baralho focado.
      </p>

      <div
        ref={deckRef}
        tabIndex={0}
        role="group"
        aria-label="Baralho de recomendações do Match Solidário"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            handleInterest();
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            handlePass();
          }
        }}
        onTouchStart={(e) => {
          touchStart.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (touchStart.current == null) return;
          const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStart.current;
          touchStart.current = null;
          if (delta > 60) handleInterest();
          else if (delta < -60) handlePass();
        }}
        className="card-animate rounded-2xl border-2 border-brand-200 bg-white p-5 shadow-md sm:p-6"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand-100 px-3 py-1 text-sm font-bold text-brand-900">
            {card.category}
          </span>
          {card.meta && <span className="rounded-full bg-sand-100 px-3 py-1 text-sm text-ink/70">{card.meta}</span>}
        </div>

        <h3 className="mt-3 text-2xl font-bold text-ink">{card.title}</h3>
        <p className="mt-2 text-ink/80">{card.description}</p>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-sand-50 p-3">
            <dt className="font-semibold text-ink/60">Região aproximada</dt>
            <dd className="mt-0.5 text-base font-semibold text-ink">{card.region}</dd>
          </div>
          <div className="rounded-xl bg-sand-50 p-3">
            <dt className="font-semibold text-ink/60">Quantidade / disponibilidade</dt>
            <dd className="mt-0.5 text-base font-semibold text-ink">{card.quantity}</dd>
          </div>
        </dl>

        <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-3">
          <p className="text-sm font-semibold text-brand-900">Por que é compatível?</p>
          <p className="mt-1 text-sm text-brand-900">{card.reason}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={handlePass} className="flex-1" aria-label={`${passLabel} (seta para a esquerda)`}>
          ← {passLabel}
        </Button>
        <Button onClick={handleInterest} className="flex-1" aria-label={`${interestLabel} (seta para a direita)`}>
          {interestLabel} →
        </Button>
      </div>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
