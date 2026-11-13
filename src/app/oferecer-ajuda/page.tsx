"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, Field, Input, Notice, Select, Textarea } from "@/components/ui";

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

export default function OferecerAjudaPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offerId, setOfferId] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      type: String(form.get("type") ?? "DONATION"),
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
      setOfferId(data.offer.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  if (offerId) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold text-ink">Oferta registrada!</h1>
        <Card>
          <Notice kind="success">
            <p className="font-semibold">Obrigado por ajudar! ✓</p>
            <p className="mt-1">
              Sua oferta entrou no Match Solidário. Quando alguém se interessar e a organização confirmar,
              o atendimento é acompanhado pela Central.
            </p>
          </Notice>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/match?mode=ajudar&offerId=${offerId}`}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-brand-700 px-6 py-3 font-semibold text-white hover:bg-brand-800"
            >
              Ver necessidades compatíveis
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border-2 border-brand-700 px-6 py-3 font-semibold text-brand-800 hover:bg-brand-50"
            >
              Voltar ao início
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-ink">Oferecer ajuda</h1>
        <p className="mt-2 text-ink/70">
          Cadastre uma doação ou a sua disponibilidade para voluntariado. Conectamos a sua oferta a
          necessidades compatíveis — sempre com validação da organização.
        </p>
      </header>

      {error && <Notice kind="error">{error}</Notice>}

      <Card>
        <form onSubmit={onSubmit} noValidate>
          <Field label="Nome ou identificação de demonstração" htmlFor="name" required>
            <Input id="name" name="name" required minLength={2} maxLength={80} placeholder="Ex.: Doador João (demonstração)" />
          </Field>

          <Field label="Tipo de oferta" htmlFor="type" required>
            <Select id="type" name="type" required defaultValue="DONATION">
              <option value="DONATION">Doação (itens)</option>
              <option value="VOLUNTEERING">Voluntariado (trabalho/tempo)</option>
            </Select>
          </Field>

          <Field label="Categoria" htmlFor="category" required>
            <Select id="category" name="category" required defaultValue="Colchões">
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Item ou serviço" htmlFor="item" hint="Ex.: colchões, cesta básica, ajuda na limpeza.">
            <Input id="item" name="item" maxLength={120} placeholder="Item ou serviço" />
          </Field>

          <Field label="Quantidade (se aplicável)" htmlFor="quantity">
            <Input id="quantity" name="quantity" type="number" min={1} max={100000} inputMode="numeric" placeholder="Ex.: 2" />
          </Field>

          <Field label="Região aproximada" htmlFor="region" required hint="Bairro ou região do Recife onde você pode atuar/doar.">
            <Input id="region" name="region" required minLength={2} maxLength={80} placeholder="Bairro, Recife" />
          </Field>

          <Field label="Disponibilidade" htmlFor="availability" hint="Ex.: fins de semana, até o fim do mês, imediata.">
            <Input id="availability" name="availability" maxLength={120} placeholder="Quando você pode ajudar" />
          </Field>

          <Field label="Descreva a oferta" htmlFor="description" required>
            <Textarea id="description" name="description" required minLength={10} maxLength={2000} rows={4} placeholder="Ex.: Tenho dois colchões em bom estado para doar." />
          </Field>

          <Button type="submit" loading={loading} className="w-full">
            Cadastrar oferta
          </Button>
        </form>
      </Card>
    </div>
  );
}
