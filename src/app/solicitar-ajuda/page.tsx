"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, Field, Input, Notice, Select, Stepper, Textarea } from "@/components/ui";
import { IconArrowRight, IconCheck, IconCopy, IconHandHeart, IconShield, IconSparkle } from "@/components/icons";
import { saveLocalRequest } from "@/lib/local-records";

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
  shortCode: string | null;
  category: string;
  item: string | null;
  quantity: number | null;
  region: string;
  createdAt: string;
};

type Step = "form" | "review" | "done";

const STEPS = ["Seu relato", "Conferir classificação", "Enviado"];

export default function SolicitarAjudaPage() {
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedRequest | null>(null);
  const [audit, setAudit] = useState<AiAudit | null>(null);
  const [copied, setCopied] = useState(false);

  // revisão
  const [revCategoria, setRevCategoria] = useState("Outros");
  const [revItem, setRevItem] = useState("");
  const [revQuantity, setRevQuantity] = useState("");

  const stepIndex = step === "form" ? 0 : step === "review" ? 1 : 2;

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
      saveLocalRequest({
        id: request.id,
        shortCode: request.shortCode ?? null,
        category: request.category,
        item: request.item,
        region: request.region,
        createdAt: request.createdAt ?? new Date().toISOString()
      });
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
      window.scrollTo({ top: 0, behavior: "smooth" });
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
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    if (!created?.shortCode) return;
    try {
      await navigator.clipboard.writeText(created.shortCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard bloqueado: o código continua visível na tela */
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-2xs font-bold uppercase tracking-[0.12em] text-brand-700">
          <IconHandHeart size={15} /> Módulo A · Solicitação de ajuda
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Solicitar ajuda</h1>
        <p className="text-muted">
          Conte com as suas palavras o que aconteceu e do que você precisa. A gente organiza o pedido com apoio de
          IA — e <strong className="text-ink">você confere e corrige</strong> antes de enviar.
        </p>
        <Stepper steps={STEPS} current={stepIndex} />
      </header>

      {error && (
        <Notice kind="error" title="Não foi possível concluir">
          {error}
        </Notice>
      )}

      {step === "form" && (
        <Card>
          <form onSubmit={onSubmitForm} noValidate>
            <Field
              label="Como podemos te identificar neste pedido?"
              htmlFor="name"
              required
              hint="Pode ser um apelido ou “Família Souza”. Não use número de documento."
            >
              <Input
                id="name"
                name="name"
                required
                minLength={2}
                maxLength={80}
                autoComplete="off"
                placeholder="Ex.: Família Souza (demonstração)"
              />
            </Field>

            <Field
              label="Em qual bairro ou região?"
              htmlFor="region"
              required
              hint="Só a região aproximada. Nunca pedimos endereço completo."
            >
              <Input id="region" name="region" required minLength={2} maxLength={80} placeholder="Ex.: Casa Amarela, Recife" />
            </Field>

            <div className="grid gap-x-4 sm:grid-cols-2">
              <Field label="Tipo de necessidade" htmlFor="category" required>
                <Select id="category" name="category" required defaultValue="Colchões">
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Quantidade" htmlFor="quantity" optional hint="Se souber. Ex.: 2">
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min={1}
                  max={100000}
                  inputMode="numeric"
                  placeholder="2"
                />
              </Field>
            </div>

            <Field label="Item específico" htmlFor="item" optional hint="Ex.: colchão de casal, galão de água, cesta básica.">
              <Input id="item" name="item" maxLength={120} placeholder="Item específico" />
            </Field>

            <Field
              label="O que aconteceu e do que você precisa?"
              htmlFor="description"
              required
              hint="Conte com suas palavras. Ex.: “Perdemos os colchões no alagamento. Precisamos de dois colchões.”"
            >
              <Textarea
                id="description"
                name="description"
                required
                minLength={10}
                maxLength={2000}
                rows={5}
                placeholder="Escreva aqui..."
              />
            </Field>

            <Field
              label="Como a organização pode te acompanhar?"
              htmlFor="contactMethod"
              optional
              hint="Contato de um vizinho, de uma associação, ou “retornar pela Central”. Nunca exibimos isso publicamente."
            >
              <Input id="contactMethod" name="contactMethod" maxLength={120} placeholder="Forma de acompanhamento" />
            </Field>

            <Button type="submit" size="lg" loading={loading} className="w-full">
              Revisar e registrar
              <IconArrowRight size={18} />
            </Button>
            <p className="mt-3 text-center text-xs text-muted">
              Você vai poder conferir a classificação antes de enviar. Nada é publicado com seus dados de contato.
            </p>
          </form>
        </Card>
      )}

      {step === "review" && (
        <Card eyebrow="Passo 2 de 3" title="Confira a classificação do pedido">
          {audit?.status === "UNAVAILABLE" ? (
            <Notice kind="warning" title="Análise automática indisponível">
              <p>{audit.reason}</p>
              <p className="mt-1">Classifique manualmente abaixo — nada foi atribuído à IA.</p>
            </Notice>
          ) : audit?.original ? (
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
              <p className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-[0.1em] text-brand-800">
                <IconSparkle size={13} /> Sugestão da IA {audit.model ? `· ${audit.model}` : ""}
              </p>
              <p className="mt-2 font-semibold text-brand-900">
                {audit.original.categoria}
                {audit.original.item ? ` · ${audit.original.item}` : ""}
                {audit.original.quantidade ? ` · qtd ${audit.original.quantidade}` : ""}
              </p>
              {audit.original.contexto && <p className="mt-1 text-sm text-brand-900/80">{audit.original.contexto}</p>}
              {audit.original.precisa_revisao && (
                <p className="mt-2 rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-alert">
                  O relato parece ambíguo — revise com atenção.
                </p>
              )}
              <p className="mt-2 flex items-center gap-1.5 text-xs text-brand-900/80">
                <IconShield size={13} /> Sugestão é apoio, não decisão. Você pode corrigir qualquer campo.
              </p>
            </div>
          ) : null}

          <div className="mt-5">
            <Field label="Categoria final" htmlFor="rev-categoria" required>
              <Select id="rev-categoria" value={revCategoria} onChange={(event) => setRevCategoria(event.target.value)}>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid gap-x-4 sm:grid-cols-2">
              <Field label="Item final" htmlFor="rev-item" optional>
                <Input id="rev-item" value={revItem} onChange={(event) => setRevItem(event.target.value)} maxLength={120} />
              </Field>
              <Field label="Quantidade final" htmlFor="rev-quantity" optional>
                <Input
                  id="rev-quantity"
                  type="number"
                  min={1}
                  max={100000}
                  value={revQuantity}
                  onChange={(event) => setRevQuantity(event.target.value)}
                />
              </Field>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Button onClick={onConfirmReview} loading={loading} size="lg" className="flex-1">
              <IconCheck size={18} /> Confirmar e enviar à organização
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setStep("form")}
              disabled={loading}
              className="flex-1"
            >
              Voltar e editar
            </Button>
          </div>
        </Card>
      )}

      {step === "done" && created && (
        <div className="space-y-4">
          <Card className="border-brand-300 bg-brand-50/60">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-700 text-white">
                <IconCheck size={26} />
              </span>
              <div>
                <h2 className="text-xl font-extrabold text-ink">Pedido registrado</h2>
                <p className="mt-1 text-sm text-muted">
                  Ele está <strong className="text-ink">aguardando validação</strong> da organização na Central de
                  Mobilização. Você acompanha tudo por este código:
                </p>
              </div>

              {created.shortCode && (
                <div className="flex items-center gap-2 rounded-xl border border-brand-300 bg-white px-4 py-3">
                  <span className="font-mono text-xl font-bold tracking-[0.12em] text-brand-900">
                    {created.shortCode}
                  </span>
                  <Button variant="ghost" size="sm" onClick={copyCode} aria-label="Copiar código do pedido">
                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                    {copied ? "Copiado" : "Copiar"}
                  </Button>
                </div>
              )}

              <p className="text-xs text-muted">
                Esse pedido também ficou salvo em <strong className="text-ink">Meus pedidos</strong>, neste navegador.
              </p>
            </div>
          </Card>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Link
              href={`/match?mode=preciso&requestId=${created.id}`}
              className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 py-3 font-bold text-white shadow-soft hover:bg-brand-800"
            >
              Ver ofertas compatíveis <IconArrowRight size={18} />
            </Link>
            <Link
              href="/meus-pedidos"
              className="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-xl border border-line bg-white px-6 py-3 font-bold text-ink hover:border-brand-300 hover:bg-brand-50"
            >
              Meus pedidos
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
