/**
 * Memória local do navegador (sem login).
 *
 * O morador não cria conta para pedir ajuda. Para não perder o próprio pedido
 * (e não precisar colar um UUID num <select>), guardamos o mínimo necessário
 * no localStorage: id, código curto, categoria, item, região e data.
 *
 * Nada sensível é guardado — sem nome, sem relato, sem contato.
 */

export interface LocalRequest {
  id: string;
  shortCode: string | null;
  category: string;
  item: string | null;
  region: string;
  createdAt: string;
}

export interface LocalOffer {
  id: string;
  category: string;
  item: string | null;
  region: string;
  type: "DONATION" | "VOLUNTEERING";
  createdAt: string;
}

const REQUESTS_KEY = "redeSolidaria.requests.v1";
const OFFERS_KEY = "redeSolidaria.offers.v1";
const MAX_ITEMS = 12;

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, items: T[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    /* localStorage indisponível (modo privado): o app continua funcionando */
  }
}

function upsert<T extends { id: string }>(items: T[], item: T): T[] {
  return [item, ...items.filter((existing) => existing.id !== item.id)].slice(0, MAX_ITEMS);
}

export function listLocalRequests(): LocalRequest[] {
  return read<LocalRequest>(REQUESTS_KEY);
}

export function saveLocalRequest(request: LocalRequest): void {
  write(REQUESTS_KEY, upsert(listLocalRequests(), request));
}

export function listLocalOffers(): LocalOffer[] {
  return read<LocalOffer>(OFFERS_KEY);
}

export function saveLocalOffer(offer: LocalOffer): void {
  write(OFFERS_KEY, upsert(listLocalOffers(), offer));
}

export function clearLocalRecords(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(REQUESTS_KEY);
    window.localStorage.removeItem(OFFERS_KEY);
  } catch {
    /* ignora */
  }
}
