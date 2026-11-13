"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, Field, Input, Notice, Select, Stepper, Textarea } from "@/components/ui";
import {
  IconArrowRight,
  IconCheck,
  IconClock,
  IconCopy,
  IconHandHeart,
  IconPin,
  IconShield,
  IconSparkle,
  IconUsers
} from "@/components/icons";
import { CATEGORIAS } from "@/lib/categorias";
import { saveLocalRequest } from "@/lib/local-records";

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

/** O que a pessoa digitou — mostrado ao lado da classificação para conferência. */
type ReportSummary = {
  name: string;
  region: string;
  category: string;
  item: string | null;
  quantity: number | null;
  description: string;
};

type Step = "form" | "review" | "done";

const STEPS = ["Seu relato", "Conferir classificação", "Enviado"];

export default function SolicitarAjudaPage() {
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedRequest | null>(null);
  const [audit, setAudit] = useState<AiAudit | null>(null);
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [copied, setCopied] = useState(false);

  // revisão
  const [revCategoria, setRevCategoria] = useState("Outros");
  const [revItem, setRevItem] = useState("");
  const [revQuantity, setRevQuantity] = useState("");

  const stepIndex = step === "form" ? 0 : step === "review" ? 1 : 2;
  const aiUsed = audit?.status === "SUGGESTED" && Boolean(audit.original);

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
      setReport({
        name: payload.name,
        region: request.region ?? payload.region,
        category: payload.category,
        item: payload.item,
        quantity: payload.quantity,
        description: payload.description
      });
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

      {/* ── Passo 1 ─────────────────────────────────────────────────────── */}
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

      {/* ── Passo 2 ─────────────────────────────────────────────────────── */}
      {step === "review" && (
        <Card
          eyebrow="Passo 2 de 3"
          title="Confira a classificação"
          actions={
            <Badge tone={aiUsed ? "brand" : "neutral"} dot>
              {aiUsed ? "Sugestão da IA" : "Classificação manual"}
            </Badge>
          }
        >
          {report && (
            <div className="mb-5 rounded-xl border border-line bg-canvas p-4">
              <p className="text-2xs font-bold uppercase tracking-[0.1em] text-muted">Seu relato</p>
              <p className="mt-2 text-sm leading-relaxed text-ink/85">{report.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <IconPin size={13} /> {report.region}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <IconUsers size={13} /> {report.name}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <IconClock size={13} /> agora
                </span>
              </div>
            </div>
          )}

          {aiUsed && audit?.original ? (
            <div className="mb-5 rounded-xl border border-brand-200 bg-brand-50 p-4">
              <p className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-[0.1em] text-brand-800">
                <IconSparkle size={13} /> O que a IA entendeu
              </p>
              <p className="mt-2 text-lg font-bold text-brand-900">
                {audit.original.categoria}
                {audit.original.item ? ` · ${audit.original.item}` : ""}
                {audit.original.quantidade ? ` · ${audit.original.quantidade} un.` : ""}
              </p>
              {audit.original.contexto && <p className="mt-1 text-sm text-brand-900/80">{audit.original.contexto}</p>}
              {audit.original.precisa_revisao && (
                <p className="mt-2 rounded-lg bg-white/70 px-3 py-2 text-sm font-semibold text-alert">
                  O relato parece ambíguo — vale conferir com atenção.
                </p>
              )}
              <p className="mt-2 flex items-center gap-1.5 text-xs text-brand-900/80">
                <IconShield size={13} /> Sugestão é apoio, não decisão. Corrija o que precisar abaixo.
              </p>
            </div>
          ) : (
            <div className="mb-5 rounded-xl border border-line bg-white p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                  <IconShield size={19} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink">Classificação manual neste ambiente</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    A análise automática está desligada por falta de chave de IA. Escolha os campos abaixo com
                    calma — o pedido <strong className="text-ink">não</strong> será marcado como resultado de IA.
                  </p>
                  <details className="mt-2.5 rounded-lg bg-canvas px-3 py-2">
                    <summary className="cursor-pointer text-xs font-bold text-brand-800">
                      Como ativar a análise automática (organização)
                    </summary>
                    <p className="mt-2 text-xs leading-relaxed text-muted">
                      Defina <code className="rounded bg-white px-1 py-0.5">OPENAI_API_KEY</code> no{" "}
                      <code className="rounded bg-white px-1 py-0.5">.env.local</code> (funciona com OpenAI, Gemini,
                      Groq ou OpenRouter) e reinicie o servidor. Passo a passo em{" "}
                      <code className="rounded bg-white px-1 py-0.5">docs/configurar-ia.md</code>.
                    </p>
                  </details>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-0">
            <Field label="Categoria final" htmlFor="rev-categoria" required hint="O que a família precisa.">
              <Select id="rev-categoria" value={revCategoria} onChange={(event) => setRevCategoria(event.target.value)}>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid gap-x-4 sm:grid-cols-2">
              <Field label="Item final" htmlFor="rev-item" optional hint="Ex.: colchão de casal">
                <Input id="rev-item" value={revItem} onChange={(event) => setRevItem(event.target.value)} maxLength={120} />
              </Field>
              <Field label="Quantidade final" htmlFor="rev-quantity" optional hint="Ex.: 2">
                <Input
                  id="rev-quantity"
                  type="number"
                  min={1}
                  max={100000}
                  inputMode="numeric"
                  value={revQuantity}
                  onChange={(event) => setRevQuantity(event.target.value)}
                />
              </Field>
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-2.5 sm:flex-row-reverse">
            <Button onClick={onConfirmReview} loading={loading} size="lg" className="flex-1 whitespace-nowrap">
              <IconCheck size={18} /> Confirmar e enviar
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
          <p className="mt-3 text-center text-xs text-muted">
            Depois de enviar, o pedido fica <strong className="text-ink">aguardando validação</strong> da organização.
          </p>
        </Card>
      )}

      {/* ── Passo 3 ─────────────────────────────────────────────────────── */}
      {step === "done" && created && (
        <div className="space-y-4">
          <Card className="border-brand-200 bg-brand-50/50">
            <div className="flex flex-col items-center gap-4 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-700 text-white shadow-soft">
                <IconCheck size={26} />
              </span>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-ink">Pedido registrado</h2>
                <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-muted">
                  Está <strong className="text-ink">aguardando validação</strong> da organização na Central de
                  Mobilização. Você acompanha tudo por este código:
                </p>
              </div>

              {created.shortCode && (
                <div className="flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-3">
                  <span className="font-mono text-xl font-bold tracking-[0.12em] text-brand-900">
                    {created.shortCode}
                  </span>
                  <Button variant="ghost" size="sm" onClick={copyCode} aria-label="Copiar código do pedido">
                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                    {copied ? "Copiado" : "Copiar"}
                  </Button>
                </div>
              )}

              <ol className="mt-1 w-full max-w-md space-y-2 text-left">
                {[
                  { title: "Organização valida", text: "Uma pessoa confere o pedido e a classificação." },
                  { title: "Match procura ofertas", text: "Doadores compatíveis aparecem por bairro e item." },
                  { title: "Atendimento acompanhado", text: "Cada conexão tem status até ser concluída." }
                ].map((item, index) => (
                  <li key={item.title} className="flex items-start gap-3 rounded-xl bg-white/80 p-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-700 text-2xs font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="text-sm">
                      <span className="block font-semibold text-ink">{item.title}</span>
                      <span className="block text-muted">{item.text}</span>
                    </span>
                  </li>
                ))}
              </ol>

              <p className="text-xs text-muted">
                O pedido também ficou salvo em <strong className="text-ink">Meus pedidos</strong>, neste navegador.
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
