"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, EmptyState, SectionHeading, Skeleton } from "@/components/ui";
import { RequestStatusBadge } from "@/components/StatusBadge";
import { IconArrowRight, IconCards, IconHandHeart, IconHeart, IconList, IconPin, IconClock } from "@/components/icons";
import { formatDateTime } from "@/lib/format";
import { listLocalOffers, listLocalRequests, type LocalOffer, type LocalRequest } from "@/lib/local-records";

type LoadedRequest = LocalRequest & { status: string | null };

/**
 * "Meus pedidos": o elo que faltava na jornada.
 * Guardamos os registros deste navegador (sem login) e conferimos o status
 * atualizado no servidor a cada visita.
 */
export default function MeusPedidosPage() {
  const [requests, setRequests] = useState<LoadedRequest[]>([]);
  const [offers, setOffers] = useState<LocalOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const localRequests = listLocalRequests();
    setOffers(listLocalOffers());
    if (localRequests.length === 0) {
      setLoading(false);
      return;
    }
    setRequests(localRequests.map((request) => ({ ...request, status: null })));

    Promise.all(
      localRequests.map(async (request) => {
        try {
          const res = await fetch(`/api/requests/${request.id}`);
          if (!res.ok) return { ...request, status: null };
          const data = await res.json();
          return {
            ...request,
            status: data?.request?.status ?? null,
            shortCode: data?.request?.shortCode ?? request.shortCode
          };
        } catch {
          return { ...request, status: null };
        }
      })
    )
      .then(setRequests)
      .finally(() => setLoading(false));
  }, []);

  const isEmpty = !loading && requests.length === 0 && offers.length === 0;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-2xs font-bold uppercase tracking-[0.12em] text-brand-700">
          <IconList size={15} /> Seus registros neste navegador
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Meus pedidos e ofertas</h1>
        <p className="text-muted">
          Sem cadastro e sem senha: seus pedidos ficam salvos neste navegador e você acompanha o status puxado do
          servidor. Em outro aparelho, use o código do pedido.
        </p>
      </header>

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      )}

      {isEmpty && (
        <EmptyState
          icon={<IconHandHeart size={22} />}
          title="Você ainda não registrou nada aqui"
          description="Peça ajuda ou cadastre uma oferta — o registro aparece nesta página, com status e atalho para o match."
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/solicitar-ajuda"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-bold text-white shadow-soft hover:bg-brand-800"
              >
                Solicitar ajuda <IconArrowRight size={16} />
              </Link>
              <Link
                href="/oferecer-ajuda"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-ink hover:border-brand-300"
              >
                Oferecer ajuda
              </Link>
            </div>
          }
        />
      )}

      {requests.length > 0 && (
        <section aria-labelledby="meus-pedidos">
          <SectionHeading title="Pedidos de ajuda" description="Acompanhe a validação e as conexões de cada pedido." />
          <ul id="meus-pedidos" className="space-y-3">
            {requests.map((request) => (
              <li key={request.id}>
                <Card className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-ink">
                          {request.category}
                          {request.item ? ` — ${request.item}` : ""}
                        </h3>
                        {request.shortCode && (
                          <Badge tone="neutral" className="font-mono tracking-[0.08em]">
                            {request.shortCode}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                        <span className="inline-flex items-center gap-1">
                          <IconPin size={13} /> {request.region}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <IconClock size={13} /> {formatDateTime(request.createdAt)}
                        </span>
                      </p>
                    </div>
                    {request.status ? (
                      <RequestStatusBadge status={request.status} />
                    ) : (
                      <Badge tone="neutral" dot>
                        sem conexão
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Link
                      href={`/pedidos/${request.shortCode ?? request.id}`}
                      className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-ink hover:border-brand-300 hover:bg-brand-50"
                    >
                      Acompanhar status
                    </Link>
                    <Link
                      href={`/match?mode=preciso&requestId=${request.id}`}
                      className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-bold text-white shadow-soft hover:bg-brand-800"
                    >
                      <IconCards size={16} /> Ver ofertas compatíveis
                    </Link>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      {offers.length > 0 && (
        <section aria-labelledby="minhas-ofertas">
          <SectionHeading title="Ofertas de ajuda" description="Suas doações e disponibilidades de voluntariado." />
          <ul id="minhas-ofertas" className="space-y-3">
            {offers.map((offer) => (
              <li key={offer.id}>
                <Card className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-ink">
                          {offer.category}
                          {offer.item ? ` — ${offer.item}` : ""}
                        </h3>
                        <Badge tone={offer.type === "VOLUNTEERING" ? "sand" : "brand"}>
                          {offer.type === "VOLUNTEERING" ? "Voluntariado" : "Doação"}
                        </Badge>
                      </div>
                      <p className="mt-1 flex items-center gap-1 text-sm text-muted">
                        <IconPin size={13} /> {offer.region}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/match?mode=ajudar&offerId=${offer.id}`}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-bold text-white shadow-soft hover:bg-brand-800"
                  >
                    <IconHeart size={16} /> Ver necessidades compatíveis
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(requests.length > 0 || offers.length > 0) && (
        <Card className="bg-canvas">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-ink">Trocou de aparelho ou limpou o navegador?</p>
              <p className="text-sm text-muted">
                Use o código do pedido (ex.: RS-4F7K) para abrir o acompanhamento: <code className="rounded bg-white px-1.5 py-0.5">/pedidos/RS-4F7K</code>
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setLoading(true);
                  window.location.reload();
                }}
              >
                Atualizar status
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
