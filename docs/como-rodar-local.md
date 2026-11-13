# Como rodar o projeto localmente

Guia curto para ver as alterações na sua máquina. Vale para Windows (PowerShell), macOS e Linux.

---

## 0. O que você precisa ter

| Item | Versão | Como conferir |
|---|---|---|
| Node.js | **22 ou mais** | `node -v` |
| npm | vem com o Node | `npm -v` |
| Git | qualquer | `git --version` |

Se `node -v` mostrar `v18`/`v20` ou “comando não encontrado”, instale a LTS em
[nodejs.org](https://nodejs.org) e **feche e reabra o VS Code** (o terminal do VS Code herda o
PATH antigo).

---

## 1. Atualizar o clone que já existe

No terminal integrado do VS Code (`Ctrl + '`), dentro da pasta `rede-solidaria`:

```powershell
git checkout main
git pull origin main
git log --oneline -1
```

A última linha tem que mostrar um commit de **merge** recente (o mais novo da `main`).
Se aparecer algo antigo, o `pull` não entrou — veja a seção 6.

> Deu `error: Your local changes would be overwritten`? Você editou arquivos localmente.
> Guarde (`git stash`) ou descarte (`git checkout -- .`) antes de puxar.

## 2. Instalar dependências

```powershell
npm ci
```

- `npm ci` instala exatamente o que está no `package-lock.json` (é o que o CI usa).
- Avisos amarelos de vulnerabilidade no fim são normais. **Não rode** `npm audit fix --force`:
  ele sobe versões major e quebra o Next 15 / React 19.

## 3. Recriar o banco de demonstração

O schema ganhou colunas e tabelas novas (`short_code`, `match_dismissals`, `owner_session`).
O jeito limpo de ver a demo é começar do zero:

```powershell
Remove-Item -Recurse -Force .data
npm run seed
```

O seed imprime os registros criados e termina com
`✓ Seed concluído. Todos os registros são fictícios, para demonstração.`

> Em macOS/Linux: `rm -rf .data && npm run seed`

O banco padrão é o **PGlite** (Postgres embutido) e os dados ficam na pasta `.data/`.
Não precisa instalar Postgres nem configurar Supabase para testar.

## 4. Configurar o `.env.local`

```powershell
Copy-Item .env.example .env.local -Force
```

Abra o arquivo e deixe o token com **16 caracteres ou mais** (sem isso, a Central não deixa
entrar — a validação é no servidor):

```
ADMIN_TOKEN=dev-local-token-1234567890
```

O resto pode ficar vazio:

- `DATABASE_URL` vazia → usa PGlite local;
- `OPENAI_API_KEY` vazia → o app funciona com classificação **manual** e avisa que a análise
  automática está indisponível (nunca finge ser IA).

## 5. Subir o servidor

```powershell
npm run dev
```

Espere a linha `✓ Ready in ...` e abra **http://localhost:3000**.

O terminal fica “ocupado” enquanto o servidor roda. Para rodar outra coisa (`npm test`,
`git pull`), abra um segundo terminal: `Ctrl + Shift + '`.

---

## 6. Checklist do que deve aparecer

| Onde | Deve mostrar |
|---|---|
| `/` | Hero claro com **“Quando a água sobe, a rede se move.”** (“move.” em **laranja**) e painel verde escuro “Rede em movimento” |
| `/api/health` | `{"status":"ok","banco":{"backend":"pglite","estado":"ok"},...,"central":{"adminConfigurado":true}}` |
| `/match` | Escolher **Preciso de ajuda** → pedido de **Água** → **3 cartões**; arrastar; botão **Desfazer** |
| `/solicitar-ajuda` | Formulário em etapas, com revisão da classificação antes de enviar |
| `/pedidos/[código]` | Linha do tempo; aceita código curto tipo `RS-4F7K` |
| `/meus-pedidos` | Seus registros salvos no navegador |
| `/central` | Login com o `ADMIN_TOKEN`; filtros, busca e ações |

Se `adminConfigurado` vier `false`: o arquivo não se chama `.env.local` (o Windows às vezes
salva `.env.local.txt`) ou o servidor não foi reiniciado depois da alteração.

---

## 7. Testes e build (opcional, mas é a prova de que está tudo certo)

```powershell
npm test          # 39 testes, 7 arquivos
npm run build     # build de produção (depois: npm start)
```

---

## 8. Se algo der errado

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Port 3000 is in use` | outro processo na porta | `npm run dev -- -p 3001` |
| `tsc: not found` / `next: not found` | dependências não instaladas | `npm ci` |
| Página com CSS “quebrado” depois de mudar config | cache do Tailwind/Next | pare o servidor, apague `.next`, suba de novo |
| `EBUSY`/`EPERM` no Windows | pasta dentro do OneDrive sincronizando | pause o OneDrive ou mova o projeto para `C:\dev\rede-solidaria` |
| Dados duplicados/estranhos | banco antigo em `.data` | seção 3 (apagar `.data` e rodar o seed) |
| Central não loga | `ADMIN_TOKEN` vazio/curto | 16+ caracteres no `.env.local` e reiniciar |
| `git pull` não muda nada | branch errada | `git branch --show-current` deve ser `main` |

---

## 9. Caminho garantido: clone novo em outra pasta

Se o clone atual estiver “sujo” e você só quer ver a versão nova, isso sempre funciona:

```powershell
cd C:\dev
git clone https://github.com/SergioFeitosaa/rede-solidaria.git rede-solidaria-novo
cd rede-solidaria-novo
npm ci
Copy-Item .env.example .env.local
# edite ADMIN_TOKEN no .env.local
npm run seed
npm run dev
```

---

## 10. Onde mexer para mudar o visual

Toda a identidade visual está em **`tailwind.config.ts`** (tokens):

- `brand` — verde (ação primária, painel escuro);
- `accent` — laranja (destaques, selos, ícones);
- `canvas` / `surface` / `line` — fundo creme, cartões e bordas;
- `fontFamily` / `fontSize` — tipografia e escala.

Mudar um valor ali reflete em todas as telas. Detalhes em
[`docs/design-system.md`](./design-system.md).
