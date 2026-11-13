/**
 * Categorias fixas do MVP (Módulo A do escopo).
 * Ficam aqui — e não dentro do módulo de IA — para que telas de formulário não
 * carreguem a dependência de validação (zod) só para listar opções.
 */
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
