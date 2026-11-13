# Design system — Rede Solidária Inteligente

Notas da reformulação de interface. A ideia é simples: **toda decisão visual mora em um
lugar só**, para que alinhar com um layout do Figma seja mexer em tokens, não caçar classes
em 15 arquivos.

## 1. Onde ficam os tokens

`tailwind.config.ts` → `theme.extend`. Nada de cor solta (`#0d6a56`) nas telas.

| Token | Valor | Uso |
|---|---|---|
| `brand.700` | `#0d6a56` | ação primária, links fortes, foco |
| `brand.900` | `#0c453a` | hero, cabeçalhos sobre branco |
| `brand.50/100` | `#eefbf6` / `#d3f5e8` | fundos de destaque, badges |
| `canvas` | `#f5f7f6` | fundo da página |
| `surface` | `#ffffff` | cartões |
| `line` | `#e3e8e5` | bordas (1px, sempre) |
| `muted` | `#5c6b66` | texto secundário |
| `ink` | `#16211e` | texto principal |
| `success` / `alert` / `danger` | `#0f7a5f` / `#9a5b00` / `#a51d1d` | estado |

Sombras: `soft` (cartões), `lift` (hero/modais), `deck` (cartão do swipe).
Raios: `rounded-xl` (controles), `rounded-2xl` (cartões), `rounded-3xl` (blocos grandes).

## 2. Tipografia

Escala fixa em `fontSize` (12/14/16/18/22/28/34/42/52 px, com `line-height` e
`letter-spacing` definidos). Regra prática:

- **1 `h1` por tela**, `text-3xl`–`text-4xl`, `font-extrabold`, `tracking-tight`.
- `h2` de seção: `text-2xl`; `h3` de cartão: `text-lg`.
- Rótulo pequeno: `text-2xs` + `uppercase` + `tracking-[0.1em]` (usado em eyebrows e labels de dado).

Para trocar a família, edite `fontFamily.sans`. Recomendação: Inter (ou Plus Jakarta Sans).
Se usar `next/font/google`, o build passa a precisar de rede — em ambiente offline, use
`next/font/local` com os arquivos `.woff2`.

## 3. Componentes (`src/components/ui.tsx`)

| Componente | Regra |
|---|---|
| `Button` | variantes `primary` (1 por tela), `secondary`, `soft`, `ghost`, `danger`, `onDark`; tamanhos `sm/md/lg`; alvo mínimo 44px |
| `Field` + `Input/Textarea/Select` | label sempre visível, `hint` antes do campo, erro com `role="alert"` |
| `Card` | `eyebrow` + `title` + `actions`; superfície branca, borda `line`, sombra `soft` |
| `Badge` | estado sempre com **texto** + ponto colorido (nunca só cor) |
| `Stat` | número grande + rótulo em caixa alta + dica |
| `Notice` | `info/success/warning/error`, com ícone e `role="status"` |
| `EmptyState` | ícone + título + explicação + ação |
| `Skeleton` | shimmer, para nunca mostrar "Carregando..." cru |
| `SegmentedControl` | escolha entre 2–4 modos, com `aria-pressed` |
| `Stepper` | progresso de formulário em etapas |
| `SwipeDeck` | baralho com arrastar, teclado, desfazer e modo lista |

Ícones: `src/components/icons.tsx` (SVG inline, `currentColor`, `size` opcional). Sem
dependência externa, sem requisição de fonte de ícone.

## 4. Navegação

- Desktop: header de 64px, vidro (`bg-white/85` + `backdrop-blur`), links com estado ativo
  (`aria-current="page"`).
- Mobile: barra inferior fixa com 5 destinos (Início, Pedir, Ajudar, Match, Central) e
  `padding` de área segura (iPhone).
- Foco visível em todo elemento interativo: `3px` de `brand-700` com `outline-offset: 2px`.

## 5. Como alinhar com um layout do Figma

1. **Cores**: pegue os hex do Figma e substitua em `colors` (mantenha os *nomes* dos tokens).
   `brand` = cor de ação; `canvas` = fundo; `surface` = cartão; `line` = borda.
2. **Raios e sombras**: `borderRadius` e `boxShadow` no mesmo arquivo.
3. **Tipografia**: `fontFamily.sans` + `fontSize` (se o Figma usa outra escala, ajuste só aqui).
4. **Espaçamento**: as telas usam a escala padrão do Tailwind (4/8/12/16/24/32/40). Se o
   Figma usar grid de 4, já está compatível.
5. **Componentes**: se o Figma trouxer um botão diferente, altere `BUTTON_VARIANTS` — todas as
   telas mudam juntas.

## 6. Decisões de UX que não são cosméticas

- **Código curto** (`RS-4F7K`) em vez de UUID: é o que a pessoa anota no papel.
- **`/meus-pedidos`** com `localStorage`: jornada sem login, sem senha, sem e-mail.
- **Swipe não decide ajuda**: registra interesse; a organização confirma na Central.
- **"Desfazer"** no baralho e **modo lista**: gesto é atalho, nunca a única via.
- **Dispensa persistida**: cartão recusado não reaparece (`match_dismissals`).
- **Nada de "Carregando..."**: sempre `Skeleton` com a forma do conteúdo.
