#!/usr/bin/env node
/**
 * Renova o catálogo de bairros do Recife a partir do OpenStreetMap (Overpass API).
 *
 * Uso:  node scripts/fetch-osm-bairros.mjs > data/bairros-recife.json
 *
 * Fonte primária de normalização de regiões da Rede Solidária Inteligente.
 * Dados do OpenStreetMap © colaboradores do OpenStreetMap, licença ODbL.
 * https://www.openstreetmap.org/copyright
 */
const OVERPASS = "https://overpass-api.de/api/interpreter";

// Nós de place=suburb/neighbourhood dentro do limite administrativo do Recife.
const query = `
[out:json][timeout:90];
rel["name"="Recife"]["boundary"="administrative"]["admin_level"="8"](area:36000059476);
map_to_area -> .recife;
(
  node["place"~"^(suburb|neighbourhood|quarter)$"](area.recife);
);
out tags;
`.trim();

const res = await fetch(OVERPASS, {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: `data=${encodeURIComponent(query)}`
});
if (!res.ok) {
  console.error("Overpass respondeu", res.status);
  process.exit(1);
}
const json = await res.json();
const seen = new Map();
for (const el of json.elements ?? []) {
  const name = el.tags?.name;
  if (name) seen.set(name.trim(), true);
}
const bairros = [...seen.keys()]
  .sort((a, b) => a.localeCompare(b, "pt-BR"))
  .map((nome) => ({ nome, microrregiao: null }));

process.stdout.write(
  JSON.stringify(
    {
      fonte: "OpenStreetMap — Overpass API (place=suburb|neighbourhood|quarter, limite administrativo do Recife)",
      licenca_dados: "© colaboradores do OpenStreetMap, licença ODbL 1.0 (https://www.openstreetmap.org/copyright)",
      gerado_em: new Date().toISOString().slice(0, 10),
      total: bairros.length,
      bairros
    },
    null,
    2
  )
);
