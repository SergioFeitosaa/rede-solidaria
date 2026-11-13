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

type AiAudit = {
  status: "SUGGESTED" | "ACCEPTED" | "CORRECTED" | "MANUAL" | "UNAVAILABLE";
  original: {
    categoria: string;
    item: string | null;
    quantidade: number | null;
    contexto: string | null;
    precisa_revisao: boolean;
  } | null;
  reason: string | null;
  model: string | null;
};

type CreatedRequest = {
  id: string;
  category: string;
  item: string | null;
  quantity: number | null;
};

type Step = "form" | "review" | "done";

export default function SolicitarAjudaPage() {
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedRequest | null>(null);
  const [audit, setAudit] = useState<AiAudit | null>(null);

  // revisão
  const [revCategoria, setRevCategoria] = useState("Outros");
  const [revItem, setRevItem] = useState("");
  const [revQuantity, setRevQuantity] = useState("");

  async function onSubmitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      region: String(form.get("region") ?? ""),
      category: String(form.get("category") ?? ""),
      item: String(form.get("item") ?? "") || null,
      quantity: form.get("quantity") ? Number(form.get("quantity")) : null,
      description: String(form.get("description") ?? ""),
      contactMethod: String(form.get("contactMethod") ?? "") || null
    };
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Não foi possível registrar o pedido.");
      const request: CreatedRequest = data.request;
      const ai: AiAudit = data.classification;
      setCreated(request);
      setAudit(ai);
      // Pré-preenche a revisão com a sugestão da IA (ou com o que foi digitado).
      const suggestion = ai?.original;
      setRevCategoria(suggestion?.categoria ?? request.category);
      setRevItem(suggestion?.item ?? request.item ?? "");
      setRevQuantity(
        suggestion?.quantidade != null
          ? String(suggestion.quantidade)
          : request.quantity != null
            ? String(request.quantity)
            : ""
      );
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function onConfirmReview() {
    if (!created) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/requests/${created.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          review: {
            categoria: revCategoria,
            item: revItem.trim() || null,
            quantity: revQuantity ? Number(revQuantity) : null
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Não foi possível salvar a revisão.");
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-ink">Solicitar ajuda</h1>
        <p className="mt-2 text-ink/70">
          Conte o que aconteceu e o que a sua família precisa. Usamos inteligência artificial para
          organizar o pedido — e você confere e corrige antes de enviar à organização.
        </p>
      </header>

      {error && <Notice kind="error">{error}</Notice>}

      {step === "form" && (
        <Card>
          <form onSubmit={onSubmitForm} noValidate>
            <Field label="Nome ou identificação de demonstração" htmlFor="name" required hint="Pode ser um apelido. Não publique dados de documentos.">
              <Input id="name" name="name" required minLength={2} maxLength={80} autoComplete="off" placeholder="Ex.: Família Souza (demonstração)" />
            </Field>

            <Field label="Região ou bairro" htmlFor="region" required hint="Ex.: Casa Amarela, Recife. Só a região aproximada — sem endereço completo.">
              <Input id="region" name="region" required minLength={2} maxLength={80} placeholder="Bairro, Recife" />
            </Field>

            <Field label="Tipo de necessidade" htmlFor="category" required>
              <Select id="category" name="category" required defaultValue="Colchões">
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Item (se souber)" htmlFor="item" hint="Ex.: colchão, galão de água, cesta básica.">
              <Input id="item" name="item" maxLength={120} placeholder="Item específico" />
            </Field>

            <Field label="Quantidade (se aplicável)" htmlFor="quantity">
              <Input id="quantity" name="quantity" type="number" min={1} max={100000} inputMode="numeric" placeholder="Ex.: 2" />
            </Field>

            <Field
              label="Descreva o que aconteceu e o que você precisa"
              htmlFor="description"
              required
              hint="Conte com suas palavras. Ex.: “Perdemos nossos colchões no alagamento. Precisamos de dois colchões.”"
            >
              <Textarea id="description" name="description" required minLength={10} maxLength={2000} rows={5} placeholder="Escreva aqui..." />
            </Field>

            <Field
              label="Como a organização pode acompanhar o pedido?"
              htmlFor="contactMethod"
              hint="Ex.: contato de um vizinho, de uma associação de moradores, ou “retornar pela Central”. Não exibimos isso publicamente."
            >
              <Input id="contactMethod" name="contactMethod" maxLength={120} placeholder="Forma de acompanhamento" />
            </Field>

            <Button type="submit" loading={loading} className="w-full">
              Registrar pedido
            </Button>
          </form>
        </Card>
      )}

      {step === "review" && (
        <Card title="Confira a classificação do pedido">
          {audit?.status === "UNAVAILABLE" ? (
            <Notice kind="warning">
              <p className="font-semibold">Análise automática indisponível.</p>
              <p className="mt-1 text-sm">{audit.reason}</p>
              <p className="mt-1 text-sm">Classifique manualmente abaixo. Nada foi atribuído à IA.</p>
            </Notice>
          ) : audit?.original ? (
            <Notice kind="info">
              <p className="font-semibold">
                Sugestão da IA ({audit.model ?? "modelo"}): {audit.original.categoria}
                {audit.original.item ? ` · ${audit.original.item}` : ""}
                {audit.original.quantidade ? ` · qtd ${audit.original.quantidade}` : ""}
              </p>
              {audit.original.contexto && <p className="mt-1 text-sm">Contexto identificado: {audit.original.contexto}</p>}
              {audit.original.precisa_revisao && (
                <p className="mt-1 text-sm font-semibold">⚠️ O relato parece ambíguo — revise com atenção.</p>
              )}
              <p className="mt-2 text-sm">
                A sugestão é um apoio, não uma decisão. <strong>Você pode corrigir</strong> qualquer campo.
              </p>
            </Notice>
          ) : null}

          <div className="mt-5">
            <Field label="Categoria final" htmlFor="rev-categoria" required>
              <Select id="rev-categoria" value={revCategoria} onChange={(e) => setRevCategoria(e.target.value)}>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Item final" htmlFor="rev-item">
              <Input id="rev-item" value={revItem} onChange={(e) => setRevItem(e.target.value)} maxLength={120} />
            </Field>
            <Field label="Quantidade final" htmlFor="rev-quantity">
              <Input
                id="rev-quantity"
                type="number"
                min={1}
                max={100000}
                value={revQuantity}
                onChange={(e) => setRevQuantity(e.target.value)}
              />
            </Field>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={onConfirmReview} loading={loading} className="flex-1">
              Confirmar e enviar à organização
            </Button>
            <Button variant="secondary" onClick={() => setStep("form")} disabled={loading} className="flex-1">
              Voltar e editar relato
            </Button>
          </div>
        </Card>
      )}

      {step === "done" && created && (
        <Card>
          <Notice kind="success">
            <p className="text-lg font-semibold">Pedido registrado com sucesso! ✓</p>
            <p className="mt-1">
              Ele está <strong>aguardando validação</strong> pela organização na Central de Mobilização.
              Você pode acompanhar o status pelo código do pedido.
            </p>
          </Notice>
          <div className="mt-5 space-y-3">
            <p className="text-ink/70">
              Código do pedido: <code className="rounded bg-sand-100 px-2 py-1 font-mono text-sm">{created.id}</code>
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/pedidos/${created.id}`}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-brand-700 px-6 py-3 font-semibold text-white hover:bg-brand-800"
              >
                Acompanhar meu pedido
              </Link>
              <Link
                href={`/match?mode=preciso&requestId=${created.id}`}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl border-2 border-brand-700 px-6 py-3 font-semibold text-brand-800 hover:bg-brand-50"
              >
                Ver ofertas compatíveis
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
