import catalog from "../../data/bairros-recife.json";

/**
 * Reconhecimento e normalização de região/bairro.
 *
 * Fonte primária: OpenStreetMap (API Nominatim) — consulta no servidor quando
 * há rede disponível; verificação: curl documentado em data/README.md.
 * Fallback offline: catálogo factual data/bairros-recife.json.
 */

export interface RegionRecognition {
  input: string;
  normalized: string;
  known: boolean;
  canonical: string | null;
  microrregiao: string | null;
  source: "openstreetmap" | "catalogo-offline" | "texto-livre";
  osm: { displayName: string; lat: number; lon: number } | null;
}

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

interface CatalogEntry {
  nome: string;
  microrregiao: string | null;
  regiao_raiz: number | null;
}

const CATALOG = (catalog as { bairros: CatalogEntry[] }).bairros;

export function findInCatalog(input: string): CatalogEntry | null {
  const norm = normalizeText(input);
  if (!norm) return null;
  for (const entry of CATALOG) {
    if (normalizeText(entry.nome) === norm) return entry;
  }
  // correspondência parcial: "casa amarela, recife" → "Casa Amarela"
  for (const entry of CATALOG) {
    const entryNorm = normalizeText(entry.nome);
    if (norm.includes(entryNorm) || entryNorm.includes(norm)) return entry;
  }
  return null;
}

export function allBairros(): CatalogEntry[] {
  return CATALOG;
}

// Cache simples por entrada normalizada (a região muda pouco entre pedidos).
const cache = new Map<string, RegionRecognition>();

export interface RecognizeOptions {
  fetchImpl?: typeof fetch;
  /** Desativa a consulta ao Nominatim (testes e ambientes sem rede). */
  offline?: boolean;
  timeoutMs?: number;
}

async function lookupNominatim(
  input: string,
  opts: RecognizeOptions
): Promise<RegionRecognition["osm"]> {
  if (opts.offline || process.env.OSM_LOOKUP === "off") return null;
  const doFetch = opts.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 3000);
  try {
    const url =
      "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&addressdetails=1&q=" +
      encodeURIComponent(`${input}, Recife, Pernambuco, Brasil`);
    const res = await doFetch(url, {
      signal: controller.signal,
      headers: {
        // Política de uso do Nominatim: identificar a aplicação.
        "user-agent": "RedeSolidaria/1.0 (Hackathon APONTI Academy; +https://github.com/SergioFeitosaa/rede-solidaria)"
      }
    });
    if (!res.ok) return null;
    const results = (await res.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
      address?: Record<string, string>;
    }>;
    const hit = results.find((r) => (r.display_name ?? "").includes("Recife")) ?? results[0];
    if (!hit) return null;
    return {
      displayName: hit.display_name,
      lat: Number(hit.lat),
      lon: Number(hit.lon)
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function recognizeRegion(
  input: string,
  opts: RecognizeOptions = {}
): Promise<RegionRecognition> {
  const trimmed = (input ?? "").trim();
  const normalized = normalizeText(trimmed);
  const cached = cache.get(normalized);
  if (cached) return cached;

  const entry = findInCatalog(trimmed);
  const osm = await lookupNominatim(trimmed, opts);

  const recognition: RegionRecognition = {
    input: trimmed,
    normalized,
    known: Boolean(entry) || Boolean(osm),
    canonical: entry?.nome ?? null,
    microrregiao: entry?.microrregiao ?? null,
    source: osm ? "openstreetmap" : entry ? "catalogo-offline" : "texto-livre",
    osm
  };
  cache.set(normalized, recognition);
  return recognition;
}

/** Nome de exibição da região: canônica quando conhecida; senão, entrada original. */
export function displayRegion(input: string): string {
  const entry = findInCatalog(input);
  return entry?.nome ?? input.trim();
}

export function sameRegion(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (na === nb) return true;
  const ea = findInCatalog(a);
  const eb = findInCatalog(b);
  return Boolean(ea && eb && ea.nome === eb.nome);
}
