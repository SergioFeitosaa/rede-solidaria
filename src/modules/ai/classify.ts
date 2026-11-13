import { interpretationSchema, type NeedInterpretation } from "./schema";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";

/**
 * Função 1 — Interpretação de necessidades.
 *
 * Chamada server-only a um endpoint compatível com OpenAI
 * (OpenAI, Groq, DeepSeek, OpenRouter ou Gemini via endpoint OpenAI-compatible),
 * com resposta estruturada (JSON) e validação de esquema (Zod).
 *
 * Tratamento de falhas (regra do edital): em qualquer problema — sem chave,
 * timeout, HTTP erro, JSON inválido, esquema inválido — retorna UNAVAILABLE.
 * O chamador preserva o pedido e libera classificação manual com aviso honesto.
 * Nunca apresentamos classificação manual/fixa como resultado de IA.
 */

export type ClassificationResult =
  | {
      status: "OK";
      interpretation: NeedInterpretation;
      provider: string;
      model: string;
    }
  | {
      status: "UNAVAILABLE";
      reason: string;
    };

export type ClassifyFn = (input: {
  description: string;
  region?: string | null;
  hint?: string | null;
}) => Promise<ClassificationResult>;

export interface ClassifyOptions {
  fetchImpl?: typeof fetch;
  apiKey?: string | undefined;
  baseUrl?: string | undefined;
  model?: string | undefined;
  timeoutMs?: number;
}

export function makeInterpretNeed(opts: ClassifyOptions = {}): ClassifyFn {
  return (input) => interpretNeed(input, opts);
}

export async function interpretNeed(
  input: { description: string; region?: string | null; hint?: string | null },
  opts: ClassifyOptions = {}
): Promise<ClassificationResult> {
  const apiKey = opts.apiKey ?? process.env.OPENAI_API_KEY;
  const baseUrl = (opts.baseUrl ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(
    /\/+$/,
    ""
  );
  const model = opts.model ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  if (!apiKey) {
    return {
      status: "UNAVAILABLE",
      reason: "Chave de IA não configurada (variável OPENAI_API_KEY). Análise automática indisponível."
    };
  }

  const doFetch = opts.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 20000);

  try {
    const res = await doFetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(input) }
        ]
      }),
      signal: controller.signal
    });

    if (!res.ok) {
      return { status: "UNAVAILABLE", reason: `API de IA respondeu ${res.status}. Análise automática indisponível.` };
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content ?? "";

    let raw: unknown;
    try {
      raw = JSON.parse(content);
    } catch {
      return { status: "UNAVAILABLE", reason: "A IA não retornou JSON válido. Análise automática indisponível." };
    }

    const parsed = interpretationSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        status: "UNAVAILABLE",
        reason: "A resposta da IA não passou na validação do esquema. Análise automática indisponível."
      };
    }

    return { status: "OK", interpretation: parsed.data, provider: baseUrl, model };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      status: "UNAVAILABLE",
      reason: aborted
        ? "Tempo esgotado na chamada de IA. Análise automática indisponível."
        : "Falha ao chamar a API de IA. Análise automática indisponível."
    };
  } finally {
    clearTimeout(timer);
  }
}
