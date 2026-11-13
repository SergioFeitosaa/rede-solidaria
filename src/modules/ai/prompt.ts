import { CATEGORIAS } from "./schema";

/**
 * Prompts da Função 1 — Interpretação de necessidades.
 * A IA recebe APENAS a descrição e a região (sem nome, contato ou dados
 * pessoais do formulário), conforme a política de minimização do edital.
 */
export const SYSTEM_PROMPT = [
  "Você é um assistente de triagem da Rede Solidária Inteligente, uma plataforma",
  "que conecta moradores afetados por eventos climáticos na Região Metropolitana",
  "do Recife a doadores e voluntários.",
  "",
  "Sua tarefa: ler o relato de uma necessidade e devolver UMA classificação",
  "estruturada em JSON, sem rodeios e sem texto fora do JSON.",
  "",
  "Regras:",
  `- "categoria" deve ser exatamente uma destas: ${CATEGORIAS.map((c) => `"${c}"`).join(", ")}.`,
  '- "item" é o objeto específico (ex.: "colchão", "galão de água", "cesta básica"), ou null se não der para identificar.',
  '- "quantidade" é um inteiro positivo quando o relato mencionar número (ex.: "dois colchões" → 2), ou null.',
  '- "contexto" é uma frase curta sobre a situação (ex.: "perda associada a alagamento"), ou null.',
  '- "precisa_revisao" é true quando o relato for ambíguo, mencionar mais de um tipo',
  "  de necessidade, ou a classificação tiver qualquer incerteza.",
  "",
  "Nunca invente dados que o relato não contenha. Não classifique urgência nem risco",
  "de vida. Não faça perguntas: apenas classifique.",
  "",
  'Responda SOMENTE com o JSON: {"categoria": ..., "item": ..., "quantidade": ..., "contexto": ..., "precisa_revisao": ...}'
].join("\n");

export function buildUserPrompt(input: {
  description: string;
  region?: string | null;
  hint?: string | null;
}): string {
  const parts = [`Relato da necessidade: "${input.description.trim()}"`];
  if (input.region) parts.push(`Região aproximada informada: ${input.region}`);
  if (input.hint) parts.push(`Sugestão inicial do próprio usuário: ${input.hint}`);
  return parts.join("\n");
}
