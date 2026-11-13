import { normalizeText, sameRegion } from "@/lib/regions";

/**
 * Motor de compatibilidade do Match Solidário.
 *
 * Regras OBJETIVAS no backend (regra do edital: texto de IA nunca é a única
 * evidência de compatibilidade). A IA pode interpretar descrições, mas a
 * compatibilidade é decidida aqui: categoria × item × quantidade × região.
 * Funções puras — cobertas por testes em tests/matching-engine.test.ts.
 */

export interface EntitySummary {
  category: string;
  item: string | null;
  quantity: number | null;
  region: string | null;
}

export interface CompatibilityReport {
  compatible: boolean;
  score: number;
  reasons: string[];
  reason: string;
}

/** Aliases de categoria → sinônimos comuns em relatos coloquiais. */
const CATEGORY_ALIASES: Record<string, string[]> = {
  colchões: ["colchao", "colchoes", "cama", "colchao", "mobiliario", "mobilia", "colchao de casal", "colchao de solteiro"],
  água: ["agua", "potavel", "agua potavel", "galao", "garrafa", "agua mineral"],
  alimentos: ["alimento", "alimentos", "comida", "cesta", "cesta basica", "marmita", "arroz", "feijao", "lanche"],
  roupas: ["roupa", "roupas", "vestuario", "blusa", "calca", "agasalho", "sapato", "tenis"],
  higiene: ["higiene", "kit higiene", "sabonete", "pasta de dente", "fralda", "absorvente", "shampoo", "escova"],
  limpeza: ["limpeza", "kit limpeza", "desinfetante", "agua sanitaria", "sabao em po", "baldes", "vassoura", "pano"],
  "apoio voluntário": ["voluntario", "voluntariado", "mutirao", "apoio", "ajuda", "carregar", "limpar", "acolher"],
  outros: []
};

function tokens(value: string | null): string[] {
  if (!value) return [];
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
}

/**
 * Morfologia simples pt-BR: "colchões" ≈ "colchão", "alimentos" ≈ "alimento".
 * Conjunto de variantes de um token para comparação.
 */
function variants(token: string): Set<string> {
  const set = new Set<string>([token]);
  if (token.endsWith("oes")) set.add(token.slice(0, -3) + "ao"); // colchoes → colchao
  if (token.endsWith("aes")) set.add(token.slice(0, -3) + "ao");
  if (token.endsWith("s") && token.length > 3) set.add(token.slice(0, -1));
  return set;
}

function tokensMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const va = variants(a);
  const vb = variants(b);
  for (const x of va) if (vb.has(x)) return true;
  return false;
}

function tokenIntersection(a: string[], b: string[]): string[] {
  const out: string[] = [];
  for (const ta of a) {
    if (b.some((tb) => tokensMatch(ta, tb))) out.push(ta);
  }
  return out;
}

function categoryCompatible(request: EntitySummary, offer: EntitySummary): { ok: boolean; detail: string } {
  const rc = normalizeText(request.category);
  const oc = normalizeText(offer.category);
  if (rc === oc) return { ok: true, detail: `categoria "${request.category}"` };

  const aliases = CATEGORY_ALIASES[rc] ?? [];
  const offerAliases = CATEGORY_ALIASES[oc] ?? [];
  const offerTokens = tokens(offer.item);
  const requestTokens = tokens(request.item);

  // "Outros" só compatível quando o item bate.
  if (rc === "outros" || oc === "outros") {
    const overlap = tokenIntersection(offerTokens, requestTokens);
    return overlap.length > 0
      ? { ok: true, detail: `item em comum "${overlap[0]}"` }
      : { ok: false, detail: `categorias "${request.category}" e "${offer.category}" sem item em comum` };
  }

  if (aliases.some((a) => normalizeText(offer.category).includes(a) || offerTokens.includes(a))) {
    return { ok: true, detail: `categorias equivalentes ("${request.category}" ≈ "${offer.category}")` };
  }
  if (offerAliases.some((a) => requestTokens.includes(a) || normalizeText(request.category).includes(a))) {
    return { ok: true, detail: `categorias equivalentes ("${offer.category}" ≈ "${request.category}")` };
  }
  return {
    ok: false,
    detail: `categorias diferentes ("${request.category}" × "${offer.category}")`
  };
}

function itemCompatible(request: EntitySummary, offer: EntitySummary): { ok: boolean; detail: string } {
  const requestTokens = tokens(request.item);
  const offerTokens = tokens(offer.item);
  if (requestTokens.length === 0 && offerTokens.length === 0) {
    return { ok: true, detail: "itens genéricos dentro da categoria" };
  }
  if (requestTokens.length === 0 || offerTokens.length === 0) {
    return { ok: true, detail: "item não especificado de um dos lados" };
  }
  const overlap = tokenIntersection(offerTokens, requestTokens);
  if (overlap.length > 0) return { ok: true, detail: `item "${offer.item}" atende "${request.item}"` };
  return { ok: false, detail: `itens diferentes ("${request.item}" × "${offer.item}")` };
}

function quantityOk(request: EntitySummary, offer: EntitySummary): { ok: boolean; detail: string } {
  if (request.quantity == null || offer.quantity == null) {
    return { ok: true, detail: "quantidade não informada de um dos lados" };
  }
  if (offer.quantity >= request.quantity) {
    return { ok: true, detail: `quantidade suficiente (${offer.quantity} de ${request.quantity})` };
  }
  return {
    ok: false,
    detail: `quantidade insuficiente (oferta ${offer.quantity}, necessidade ${request.quantity})`
  };
}

/**
 * Avalia a compatibilidade entre uma NECESSIDADE e uma OFERTA.
 * A necessidade é sempre o primeiro parâmetro.
 */
export function evaluateCompatibility(
  request: EntitySummary,
  offer: EntitySummary
): CompatibilityReport {
  const cat = categoryCompatible(request, offer);
  const item = itemCompatible(request, offer);
  const qty = quantityOk(request, offer);
  const regionMatch = sameRegion(request.region, offer.region);

  const compatible = cat.ok && item.ok && qty.ok;

  let score = 0;
  const reasons: string[] = [];
  if (cat.ok) {
    score += 40;
    reasons.push(`Compatibilidade de ${cat.detail}`);
  }
  if (item.ok && (tokens(request.item).length > 0 || tokens(offer.item).length > 0)) {
    score += 25;
    reasons.push(`Oferece ${offer.item ?? "item da categoria"} — ${item.detail}`);
  }
  if (qty.ok) {
    score += 20;
    reasons.push(`Atende à quantidade solicitada (${qty.detail})`);
  }
  if (regionMatch) {
    score += 15;
    reasons.push(`Região aproximada compatível (${offer.region ?? request.region})`);
  }

  if (compatible) {
    const quantityPart = offer.quantity != null ? ` (quantidade ${offer.quantity})` : "";
    const itemPart = offer.item ? offer.item : `itens de ${offer.category.toLowerCase()}`;
    const base =
      `Esta oferta é compatível porque disponibiliza ${itemPart}${quantityPart} ` +
      `e atende à categoria solicitada ("${request.category}")`;
    const regionPart = regionMatch
      ? ` Região aproximada compatível (${offer.region ?? request.region}).`
      : "";
    return { compatible: true, score, reasons, reason: base + "." + regionPart };
  }

  const failures = [!cat.ok ? cat.detail : null, !item.ok ? item.detail : null, !qty.ok ? qty.detail : null]
    .filter(Boolean)
    .join("; ");
  return {
    compatible: false,
    score,
    reasons,
    reason: `Incompatível: ${failures}.`
  };
}
