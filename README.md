# Rede Solidária Inteligente

> **Conectando pessoas. Organizando a solidariedade. Reconstruindo comunidades.**

Solução do **Hackathon APONTI Academy: Devs Criam com IA** — desafio **Antena na Lama**,
**Caminho 3: Mobilizar e recuperar (depois da crise)**.

Plataforma web mobile-first que utiliza inteligência artificial para conectar moradores
afetados por eventos climáticos extremos na Região Metropolitana do Recife (RMR) a doadores,
voluntários e organizações — transformando pedidos de ajuda e ofertas dispersas em conexões
organizadas, transparentes e acompanháveis.

---

## 1. Problema

Eventos climáticos extremos (chuvas intensas, alagamentos, deslizamentos de barreiras) afetam
comunidades vulneráveis da RMR. Após esses eventos, moradores precisam de água, alimentos,
colchões, roupas, higiene, limpeza e apoio de voluntários — enquanto cidadãos, empresas e
organizações querem ajudar, mas as informações sobre necessidades e recursos ficam dispersas.
A desorganização dificulta a mobilização e o atendimento das famílias afetadas.

## 2. Caminho escolhido

**Caminho 3 — Mobilizar e recuperar (depois da crise):** *"Como organizar a solidariedade e
acelerar a recuperação?"*

### Fluxo principal completo (ponta a ponta)

```
Registrar necessidade → Interpretar com IA → Revisão humana → Validar (organização)
→ Registrar oferta → Recomendar compatibilidade → Interesse (Swipe/botão)
→ Confirmar match (organização) → Registrar atendimento → Indicadores
```

### Módulos

| Módulo | O que faz |
|---|---|
| **A — Solicitação de ajuda** | Form mobile-first; a IA interpreta o relato e sugere categoria/item/quantidade; a pessoa confirma ou corrige (auditoria registrada). |
| **B — Oferecer ajuda** | Cadastro de doações ou voluntariado com região e disponibilidade. |
| **C — Match Solidário com Swipe** | Um único motor de matching para os dois perfis ("Preciso de ajuda" vê ofertas; "Quero ajudar" vê pedidos). Cartões com explicação da compatibilidade, Swipe ou botões acessíveis. |
| **D — Central de Mobilização** | Painel protegido: valida pedidos, confirma conexões, registra atendimentos e mostra indicadores reais. |

## 3. Como rodar

### Pré-requisitos

- Node.js 22+ e npm.
- (Opcional) PostgreSQL — Supabase recomendado. Sem banco externo, o app usa um
  **PostgreSQL embutido (PGlite)** persistindo em `.data/`.

### Passo a passo

```bash
npm install
cp .env.example .env.local   # edite as variáveis (veja abaixo)
npm run dev                  # http://localhost:3000
```

### Variáveis de ambiente (`.env.local`)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | Produção | `postgresql://...` do Supabase. Sem ela, usa PGlite local. |
| `OPENAI_API_KEY` | Para IA | Chave de um endpoint compatível com OpenAI. |
| `OPENAI_BASE_URL` | Não | Padrão `https://api.openai.com/v1`. Funciona com Groq, DeepSeek, OpenRouter e Gemini (endpoint OpenAI-compatible). |
| `OPENAI_MODEL` | Não | Padrão `gpt-4o-mini`. |
| `ADMIN_TOKEN` | Sim (Central) | Token administrativo (mín. 16 caracteres) — validado **no servidor**. |
| `OSM_LOOKUP` | Não | `off` desativa a consulta ao Nominatim (padrão: ligada). |

### Dados de demonstração (fictícios)

```bash
npm run seed
```

Todos os registros do seed são marcados com **"(DEMONSTRAÇÃO — fictício)"** e **não representam
pessoas ou organizações reais**. No seed, a classificação é registrada como `MANUAL` — nunca
apresentamos texto fixo como resultado de IA.

### Testes e build

```bash
npm test          # 23 testes (4 arquivos), IA mockada
npm run build     # build de produção
```

## 4. Indicador de resultado

**Indicador principal (definido com a equipe):**
**Percentual de pedidos validados que tiveram atendimento concluído.**

```
atendimentos concluídos associados a pedidos distintos
────────────────────────────────────────────────────── × 100
           total de pedidos validados
```

Indicadores secundários (todos calculados de dados persistidos no banco — nunca fictícios):
pedidos cadastrados/validados, ofertas disponíveis, matches com interesse, atendimentos
concluídos, distribuição por categoria e por região. Resultados baseados em registros de
demonstração são **simulados** e estão identificados como tal.

## 5. Validação com o jovem do Movimento Pró-Criança

O edital exige dois momentos: a conversa da Sessão *Da Lama ao Caos* (Dia 1) e o teste do
protótipo (Dia 2, até 12h), em que o validador usa a solução sem ajuda enquanto a equipe observa.

> **Status honesto do registro:** este README **não inventa resultados de validação**.
> A seção deve ser preenchida com o que foi efetivamente observado, no formato abaixo.

| Item | Registro real (preencher) |
|---|---|
| Data/momento da conversa | _(a preencher)_ |
| Principais dificuldades relatadas | _(a preencher)_ |
| O que travou no teste do protótipo | _(a preencher)_ |
| Melhorias implementadas após o feedback | _(a preencher)_ |

**O que mudou depois da conversa com o validador:** _(a preencher com as alterações reais)_

## 6. Onde a IA foi usada e corrigida

### Uso (Função 1 — Interpretação de necessidades)

Ao registrar um pedido, a descrição livre é interpretada por um LLM (endpoint OpenAI-compatible,
chamado **somente no servidor**) que devolve **saída estruturada** validada por **Zod**:
`categoria` (enum fixo), `item`, `quantidade`, `contexto` e `precisa_revisao`. O prompt está em
[`src/modules/ai/prompt.ts`](src/modules/ai/prompt.ts) e a chamada em
[`src/modules/ai/classify.ts`](src/modules/ai/classify.ts).

**Minimização de dados:** a IA recebe apenas o relato e a região — nunca nome, contato ou
documentos.

### Auditoria e correção humana (obrigatória)

- A sugestão da IA aparece para a pessoa, que **confirma ou corrige** qualquer campo antes do envio.
- O sistema registra a **classificação original × a corrigida** em `ai_classification` (JSONB):
  `status` (`SUGGESTED` → `ACCEPTED`/`CORRECTED`/`MANUAL`), `original`, `final` e `corrections`
  (diff campo a campo). A tela de acompanhamento do pedido exibe esse histórico em
  **"Transparência da classificação (IA)"**.
- A organização **valida cada pedido** na Central antes de qualquer operação de match.
  A IA nunca decide sozinha quem recebe ajuda e não há classificação automática de urgência.

### Tratamento de falhas

Sem chave, timeout, HTTP erro, JSON inválido ou esquema inválido → o pedido **é preservado**,
a classificação fica **manual** (`status: MANUAL`) e a interface avisa:
*"Análise automática indisponível"*. **Nunca** apresentamos classificação manual ou fixa como
resultado real da IA — os testes `tests/ai-classify.test.ts` cobrem exatamente esses caminhos.

### Compatibilidade (regras objetivas)

O motor de matching ([`src/modules/matching/engine.ts`](src/modules/matching/engine.ts)) decide a
compatibilidade por **regras verificáveis** (categoria × item × quantidade × região) e gera a
explicação ("Esta oferta é compatível porque disponibiliza..."). Texto gerado por IA nunca é a
única evidência de compatibilidade.

## 7. Dados do Recife (kit de dados do edital)

**Fonte integrada: OpenStreetMap.** Duas integrações reais e verificáveis:

1. **Nominatim (em execução):** o servidor reconhece e normaliza o bairro informado nos
   formulários ("casa amarela" → "Casa Amarela, Recife"), exibindo a fonte ao usuário.
   Verificação manual:
   ```bash
   curl -s "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&addressdetails=1&q=Casa%20Amarela,%20Recife,%20Pernambuco,%20Brasil"
   ```
2. **Catálogo de bairros (`data/bairros-recife.json`):** usado para normalização offline e
   agregação dos indicadores por bairro/região. Pode ser renovado diretamente do OSM:
   ```bash
   node scripts/fetch-osm-bairros.mjs > data/bairros-recife.json   # Overpass API (consulta documentada)
   ```

Detalhes de proveniência e atribuição em [`data/README.md`](data/README.md).
Dados geográficos © colaboradores do OpenStreetMap (licença ODbL).

## 8. Demonstração (cenário do edital)

Após uma chuva intensa em Recife, uma família registra:
*"Perdemos nossos colchões no alagamento. Precisamos de dois colchões."*

1. Registro do pedido em `/solicitar-ajuda` (mobile-first).
2. Interpretação da descrição pela IA (com `OPENAI_API_KEY` configurada).
3. Correção/ confirmação humana da classificação (auditoria registrada).
4. Validação pela organização em `/central`.
5. Cadastro da oferta de dois colchões em `/oferecer-ajuda`.
6. Recomendação compatível em `/match` com explicação.
7. Swipe/botão de interesse nos dois lados (morador e doador).
8. Confirmação na Central → atendimento criado.
9. Atendimento: iniciar → concluir.
10. Indicadores atualizados (o pedido vira "Atendido").

Roteiro cronometrado do pitch (3 min): abertura do problema (30s) → demonstração ao vivo do
fluxo acima (1m30) → indicador e impacto (30s) → IA com auditoria + próximos passos (30s).

## 9. Deploy

### Vercel (recomendado) + Supabase

1. Crie o projeto no [Supabase](https://supabase.com) e copie a `DATABASE_URL` (Settings → Database).
   O schema é aplicado automaticamente na primeira requisição (`db/schema.sql`).
2. Importe este repositório na [Vercel](https://vercel.com/new) — framework detectado: Next.js.
3. Configure as variáveis: `DATABASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `ADMIN_TOKEN`.
4. Deploy. Acesse a URL pública e rode `npm run seed` localmente com a `DATABASE_URL` de produção
   (opcional) para popular o cenário de demonstração.

> Sem `DATABASE_URL`, a Vercel não persiste dados entre execuções (filesystem efêmero) — em
> produção use o Supabase. O PGlite serve para desenvolvimento e demonstração local.

## 10. Qualidade e CI

- **GitHub Actions** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)): `npm ci` →
  `npm test` → `npm run build` em cada push/PR na `main`.
- **Vitest** com IA mockada (nenhuma chamada externa nos testes):
  - `tests/requests.test.ts` — **Teste 1 (classificação):** validação estruturada, persistência,
    auditoria ACCEPTED/CORRECTED/MANUAL.
  - `tests/matching-engine.test.ts` — **Teste 2 (compatibilidade):** aceita compatível e rejeita
    incompatível (quantidade, categoria, item).
  - `tests/attendance-flow.test.ts` — **Teste 3 (fluxo de atendimento):** interesse → confirmação →
    conclusão, com bloqueio de confirmação duplicada e de transições inválidas.
  - `tests/ai-classify.test.ts` — saída estruturada da IA e caminhos de falha.

## 11. Segurança e privacidade

- Minimização de dados: sem endereço residencial, sem telefones nos cartões públicos; a lista
  pública de pedidos **não expõe** a forma de acompanhamento (só a Central vê).
- Rotas administrativas validam `ADMIN_TOKEN` **no servidor** (cookie httpOnly / Bearer).
- Validação de todas as entradas no servidor (Zod). Chaves de API só em variáveis de ambiente.
- A IA recebe apenas o relato e a região.
- O sistema **não substitui** Defesa Civil, serviços de emergência ou organizações humanitárias.

## 12. Acessibilidade e UX

Mobile-first, linguagem simples, botões grandes (≥48px), labels em todos os campos, alto
contraste, foco visível, navegação por teclado completa, alternativa por botões ao Swipe
(setas ← → também funcionam), mensagens de erro claras, estados de carregamento/sucesso e
anúncios `aria-live`. O Swipe representa interesse prático — nunca avaliação de pessoas.

## 13. Arquitetura

Monólito modular **Next.js (App Router) + TypeScript**:

```
├── data/                  # Catálogo de bairros + proveniência (OSM)
├── db/schema.sql          # Schema PostgreSQL (5 entidades)
├── scripts/               # seed (demo fictícia) · fetch-osm-bairros (Overpass)
├── src/
│   ├── app/               # páginas + API Route Handlers
│   ├── components/        # UI acessível + SwipeDeck
│   ├── modules/
│   │   ├── requests/      # Módulo A + auditoria de IA
│   │   ├── offers/        # Módulo B
│   │   ├── matching/      # Módulo C — motor de regras + serviços
│   │   ├── mobilization/  # Módulo D — atendimentos + indicadores
│   │   └── ai/            # interpretação estruturada (server-only)
│   └── lib/               # db (Postgres/PGlite), auth, regiões (OSM)
└── tests/                 # Vitest (23 testes)
```

Entidades: `users`, `help_requests`, `help_offers`, `matches`, `attendances` — com estados
`PENDING/VALIDATED/REJECTED/FULFILLED`, `AVAILABLE/RESERVED/UNAVAILABLE`,
`SUGGESTED/INTERESTED/PENDING_CONFIRMATION/CONFIRMED/REJECTED` e
`PENDING/IN_PROGRESS/COMPLETED/CANCELLED`.

## 14. Fora do MVP (evolução futura)

Chat em tempo real, pagamentos, gamificação, app nativo, notificações push, GPS em tempo real,
roteirização, marketplace, múltiplas organizações, previsão de desastres, treinamento de modelo
próprio, microsserviços.

---

*Hackathon APONTI Academy: Devs Criam com IA — Antena na Lama, Caminho 3. ODS 13, ODS 11, ODS 6.*
