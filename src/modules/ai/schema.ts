import { z } from "zod";

import { CATEGORIAS, type Categoria } from "@/lib/categorias";

export { CATEGORIAS, isCategoria, type Categoria } from "@/lib/categorias";

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
