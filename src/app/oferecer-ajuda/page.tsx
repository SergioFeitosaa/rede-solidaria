"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, Field, Input, Notice, Select, Textarea, cn } from "@/components/ui";
import { IconArrowRight, IconCheck, IconHeart, IconShield, IconSparkle } from "@/components/icons";
import { saveLocalOffer } from "@/lib/local-records";

const CATEGORIAS = [
  "Água",
  "Alimentos",
  "Colchões",
  "Roupas",
  "Higiene",
  "Limpeza",
  "Apoio voluntário",
  "Outros"
];

type OfferType = "DONATION" | "VOLUNTEERING";

export default function OferecerAjudaPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<OfferType>("DONATION");
  const [created, setCreated] = useState<{ id: string; category: string; item: string | null; region: string } | null>(
    null
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      type,
      category: String(form.get("category") ?? ""),
      item: String(form.get("item") ?? "") || null,
      quantity: form.get("quantity") ? Number(form.get("quantity")) : null,
      region: String(form.get("region") ?? ""),
      availability: String(form.get("availability") ?? "") || null,
      description: String(form.get("description") ?? "")
    };
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Não foi possível cadastrar a oferta.");
      const offer = data.offer;
      setCreated(offer);
      saveLocalOffer({
        id: offer.id,
        category: offer.category,
        item: offer.item,
        region: offer.region,
        type,
        createdAt: offer.createdAt ?? new Date().toISOString()
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  if (created) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Card className="border-brand-300 bg-brand-50/60">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-700 text-white">
              <IconCheck size={26} />
            </span>
            <div>
              <h1 className="text-xl font-extrabold text-ink">Oferta registrada</h1>
              <p className="mt-1 text-sm text-muted">
                {created.category}
                {created.item ? ` — ${created.item}` : ""} em {created.region}. Sua oferta entrou no Match Solidário
                e está disponível para as necessidades compatíveis.
              </p>
            </div>
            <p className="rounded-xl border border-line bg-white px-4 py-2 text-xs text-muted">
              A organização confirma cada conexão na Central antes de qualquer entrega.
            </p>
          </div>
        </Card>

        <div className="flex flex-col gap-2.5 sm:flex-row">
          <Link
            href={`/match?mode=ajudar&offerId=${created.id}`}
            className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 py-3 font-bold text-white shadow-soft hover:bg-brand-800"
          >
            Ver necessidades compatíveis <IconArrowRight size={18} />
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-xl border border-line bg-white px-6 py-3 font-bold text-ink hover:border-brand-300 hover:bg-brand-50"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-2xs font-bold uppercase tracking-[0.12em] text-brand-700">
          <IconHeart size={15} /> Módulo B · Oferta de ajuda
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Oferecer ajuda</h1>
        <p className="text-muted">
          Cadastre uma doação ou o seu tempo como voluntário. O Match Solidário procura necessidades compatíveis e a
          organização confirma a conexão — você decide o que, quando e onde.
        </p>
      </header>

      {error && (
        <Notice kind="error" title="Não foi possível cadastrar">
          {error}
        </Notice>
      )}

      <Card>
        <form onSubmit={onSubmit} noValidate>
          <fieldset className="mb-5">
            <legend className="mb-2 text-sm font-semibold text-ink">
              O que você quer oferecer? <span className="text-danger">*</span>
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { value: "DONATION" as OfferType, label: "Doação de itens", hint: "Água, alimentos, colchões…" },
                { value: "VOLUNTEERING" as OfferType, label: "Voluntariado", hint: "Tempo, transporte, mutirão…" }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={type === option.value}
                  onClick={() => setType(option.value)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left transition-all",
                    type === option.value
                      ? "border-brand-700 bg-brand-50 shadow-soft"
                      : "border-line bg-white hover:border-brand-300"
                  )}
                >
                  <span className={cn("block text-sm font-bold", type === option.value ? "text-brand-900" : "text-ink")}>
                    {option.label}
                  </span>
                  <span className="block text-xs text-muted">{option.hint}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <Field label="Como podemos te identificar?" htmlFor="name" required hint="Apelido ou nome da organização. Não publique documentos.">
            <Input id="name" name="name" required minLength={2} maxLength={80} placeholder="Ex.: Doador João (demonstração)" />
          </Field>

          <div className="grid gap-x-4 sm:grid-cols-2">
            <Field label="Categoria" htmlFor="category" required>
              <Select id="category" name="category" required defaultValue="Colchões">
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Quantidade" htmlFor="quantity" optional hint="Ex.: 2">
              <Input id="quantity" name="quantity" type="number" min={1} max={100000} inputMode="numeric" placeholder="2" />
            </Field>
          </div>

          <Field label={type === "VOLUNTEERING" ? "Que tipo de ajuda você pode dar?" : "Item específico"} htmlFor="item" optional>
            <Input id="item" name="item" maxLength={120} placeholder={type === "VOLUNTEERING" ? "Ex.: ajuda na limpeza" : "Ex.: colchões, cesta básica"} />
          </Field>

          <Field label="Onde você pode doar/atuar?" htmlFor="region" required hint="Bairro ou região da RMR.">
            <Input id="region" name="region" required minLength={2} maxLength={80} placeholder="Ex.: Casa Amarela, Recife" />
          </Field>

          <Field label="Disponibilidade" htmlFor="availability" optional hint="Ex.: fins de semana, até o fim do mês, imediata.">
            <Input id="availability" name="availability" maxLength={120} placeholder="Quando você pode ajudar" />
          </Field>

          <Field label="Descreva a oferta" htmlFor="description" required hint="Detalhes ajudam a confirmar a compatibilidade.">
            <Textarea
              id="description"
              name="description"
              required
              minLength={10}
              maxLength={2000}
              rows={4}
              placeholder="Ex.: Tenho dois colchões de solteiro em bom estado para doar."
            />
          </Field>

          <Button type="submit" size="lg" loading={loading} className="w-full">
            Cadastrar oferta
            <IconArrowRight size={18} />
          </Button>
          <p className="mt-3 flex items-start justify-center gap-2 text-center text-xs text-muted">
            <IconShield size={14} className="mt-0.5 shrink-0 text-brand-600" />
            Seu contato não aparece na plataforma. A aproximação é feita pela organização.
          </p>
        </form>
      </Card>

      <p className="flex items-start gap-2 text-xs text-muted">
        <IconSparkle size={14} className="mt-0.5 shrink-0 text-brand-600" />
        Ofertas de demonstração do seed são fictícias e identificadas como tal.
      </p>
    </div>
  );
}
