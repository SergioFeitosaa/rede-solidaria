import { z } from "zod";

/** Categorias fixas do MVP (Módulo A do escopo). */
export const CATEGORIAS = [
  "Água",
  "Alimentos",
  "Colchões",
  "Roupas",
  "Higiene",
  "Limpeza",
  "Apoio voluntário",
  "Outros"
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

export function isCategoria(value: string): value is Categoria {
  return (CATEGORIAS as readonly string[]).includes(value);
}

/**
 * Saída estruturada da interpretação de necessidade (IA — Função 1).
 * Validada com Zod antes de qualquer uso. Campos ausentes/inseguros ficam null.
 */
export const interpretationSchema = z.object({
  categoria: z.enum(CATEGORIAS),
  item: z
    .string()
    .trim()
    .max(120)
    .nullable()
    .default(null),
  quantidade: z
    .number()
    .int()
    .positive()
    .max(100000)
    .nullable()
    .default(null),
  contexto: z
    .string()
    .trim()
    .max(300)
    .nullable()
    .default(null),
  precisa_revisao: z.boolean().default(false)
});

export type NeedInterpretation = z.infer<typeof interpretationSchema>;
