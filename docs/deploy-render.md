# Deploy no Render

Guia para publicar a Rede Solidária Inteligente no [Render](https://render.com) com Postgres
gerenciado. Tempo estimado: **8 a 12 minutos**.

> **Por que não deixar o banco embutido (PGlite)?** O disco do Render é efêmero: a cada
> deploy/reinício a pasta `.data` desaparece e, no plano free, o serviço dorme após 15 min.
> Em produção use **PostgreSQL** (`DATABASE_URL`). O PGlite continua ótimo para rodar local.

---

## Resumo (o que o Render precisa)

| Campo | Valor |
|---|---|
| Runtime | **Node** |
| Build command | `npm ci && npm run build` |
| Start command | `npm start` |
| Health check path | `/api/health` |
| Node | 22 (definido em `engines` no `package.json` e em `NODE_VERSION`) |

O `start` já é `next start -H 0.0.0.0`, então o app aceita conexões de fora do container e
respeita a variável `PORT` que o Render injeta.

---

## Opção A — Blueprint (recomendado)

O repositório já tem [`render.yaml`](../render.yaml). No Render:

1. **New → Blueprint**;
2. conecte o repositório `SergioFeitosaa/rede-solidaria`;
3. o Render lê o `render.yaml`, cria o **Web Service** e o **Postgres** e liga os dois;
4. preencha as variáveis marcadas como manuais (`sync: false`):
   - `NEXT_PUBLIC_APP_URL` → a URL pública, ex.: `https://rede-solidaria.onrender.com`;
   - `OPENAI_API_KEY` → opcional (sem ela o app roda com classificação manual);
   - `OPENAI_BASE_URL` / `OPENAI_MODEL` → opcionais (veja [`configurar-ia.md`](./configurar-ia.md)).
5. **Apply**. O primeiro build leva ~2–3 min.

O `ADMIN_TOKEN` é **gerado automaticamente** pelo Render. Para descobrir o valor:
**Web Service → Environment → ADMIN_TOKEN → Reveal**.

## Opção B — Manual (Web Service + Postgres)

1. **New → PostgreSQL**: nome `rede-solidaria-db`, região igual à do serviço, plano à sua escolha.
   Copie a **Internal Database URL**.
2. **New → Web Service** → conecte o repositório.
3. Preencha:
   - **Runtime**: Node
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
4. Em **Environment**, adicione:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | Internal Database URL do Postgres criado |
| `ADMIN_TOKEN` | string aleatória com **16+ caracteres** |
| `NEXT_PUBLIC_APP_URL` | `https://SEU-SERVICO.onrender.com` |
| `NODE_VERSION` | `22.22.3` |
| `OPENAI_API_KEY` | opcional |
| `OPENAI_BASE_URL` | opcional |
| `OPENAI_MODEL` | opcional (`gpt-4o-mini` por padrão) |

5. **Create Web Service**.

---

## Depois do primeiro deploy

### 1. Verificar

Abra `https://SEU-SERVICO.onrender.com/api/health`. Esperado:

```json
{
  "status": "ok",
  "banco": { "backend": "postgresql", "estado": "ok" },
  "ia": { "configurada": false, "modelo": "gpt-4o-mini" },
  "central": { "adminConfigurado": true }
}
```

- `backend: "postgresql"` confirma que o `DATABASE_URL` foi lido (se aparecer `pglite`, a
  variável não chegou).
- `central.adminConfigurado: true` confirma o `ADMIN_TOKEN` (16+ caracteres).

### 2. Schema do banco

**Não precisa rodar migração manualmente.** Na primeira consulta, o app aplica
[`db/schema.sql`](../db/schema.sql) (tudo `CREATE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`).
Isso acontece automaticamente em cada cold start e é idempotente.

Se preferir aplicar antes (útil para inspecionar), use o **Shell** do Render:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

### 3. Dados de demonstração (opcional)

No **Shell** do serviço:

```bash
npm run seed
```

Os registros vêm marcados como `(DEMONSTRAÇÃO — fictício)`. Em produção real, **não rode**:
o app começa vazio e os pedidos chegam pelos formulários.

### 4. Acessar a Central

`https://SEU-SERVICO.onrender.com/central` com o `ADMIN_TOKEN` do passo anterior.

---

## Detalhes que costumam quebrar

| Sintoma | Causa | Solução |
|---|---|---|
| Build falha com `EBADENGINE` / Next pedindo Node ≥ 18.18 | Node antigo no Render | definir `NODE_VERSION=22.22.3` no Environment |
| `banco.estado: "erro"` | `DATABASE_URL` ausente/errada | usar a **Internal** URL (não a External) quando o banco está no Render |
| Erro `no pg_hba.conf entry ... no encryption` (Supabase) | URL sem TLS | acrescentar `?sslmode=require` ao final da URL (o app já liga TLS automático para host remoto) |
| App “dorme” e a primeira visita demora ~30s | plano free hiberna | normal no free; use um plano pago ou um ping periódico em `/api/health` |
| Dados somem após deploy | estava usando PGlite (`.data` efêmero) | definir `DATABASE_URL` |
| `central.adminConfigurado: false` | token curto/vazio | gerar token com 16+ caracteres e reiniciar o serviço |
| Limite de requisições “resetando” | contador em memória por instância | em várias instâncias, trocar por Redis/Upstash em `src/lib/rate-limit.ts` |

---

## Alternativas

- **Vercel + Supabase** (deploy do front/serverless): veja o README §9.
- **Docker/Render com disco persistente**: funcionaria com PGlite, mas custa mais que um
  Postgres gerenciado — não recomendado para o hackathon.
