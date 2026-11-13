# Configurar a análise automática (IA)

A mensagem **“Análise automática indisponível — Chave de IA não configurada”** não é um bug:
é o comportamento previsto quando não existe chave no ambiente. O pedido é registrado do mesmo
jeito, com **classificação manual** — e o sistema diz isso com todas as letras, em vez de fingir
que houve IA.

Para ver a IA funcionando em 3 minutos, escolha um provedor abaixo e reinicie o servidor.

---

## 1. Onde colocar a chave

No arquivo `.env.local` (na raiz do projeto, **nunca** versionado):

```env
OPENAI_API_KEY=sua-chave-aqui
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

Depois **pare e suba o servidor** (`Ctrl + C` e `npm run dev`) — variáveis de ambiente só são
lidas na inicialização.

Confira em **http://localhost:3000/api/health**:

```json
{
  "ia": { "configurada": true, "modelo": "gpt-4o-mini" }
}
```

`configurada: false` = a chave não chegou ao processo (nome do arquivo errado, servidor não
reiniciado ou chave vazia).

> Segurança: a chave fica **só no servidor**. Nada aqui usa prefixo `NEXT_PUBLIC_`, e o
> navegador nunca recebe a chave. A IA recebe apenas o relato e o bairro — nunca nome, contato
> ou endereço.

---

## 2. Receitas por provedor

### OpenAI (pago, mais previsível)

```env
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

### Google Gemini (tem camada gratuita)

Endpoint compatível com OpenAI:

```env
OPENAI_API_KEY=AIza...
OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
OPENAI_MODEL=gemini-2.0-flash
```

### Groq (rápido, camada gratuita)

```env
OPENAI_API_KEY=gsk_...
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_MODEL=llama-3.3-70b-versatile
```

### OpenRouter (vários modelos, um token)

```env
OPENAI_API_KEY=sk-or-...
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=openai/gpt-4o-mini
```

### DeepSeek

```env
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat
```

### Ollama (local, sem internet e sem custo)

```bash
ollama pull llama3.1
```

```env
OPENAI_API_KEY=ollama
OPENAI_BASE_URL=http://localhost:11434/v1
OPENAI_MODEL=llama3.1
```

---

## 3. Como testar

1. `npm run dev` e abra `/solicitar-ajuda`.
2. Preencha e envie um relato (ex.: “Perdemos dois colchões no alagamento”).
3. No passo 2 deve aparecer o bloco **“O que a IA entendeu”** com categoria, item e quantidade.
4. Corrija qualquer campo, confirme e abra `/pedidos/<código>`: a auditoria mostra
   `sugestão confirmada por pessoa` (ACCEPTED) ou `sugestão corrigida por pessoa` (CORRECTED).

No terminal, a chamada não aparece em log por privacidade — apenas o resultado entra no banco,
dentro de `help_requests.ai_classification`.

---

## 4. Se continuar indisponível

| Mensagem (no bloco de auditoria) | Causa | O que fazer |
|---|---|---|
| `Chave de IA não configurada` | `OPENAI_API_KEY` vazia / não lida | conferir `.env.local`, reiniciar |
| `API de IA respondeu 401` | chave inválida ou de outro provedor | gerar nova chave no provedor certo |
| `API de IA respondeu 404` | `OPENAI_BASE_URL` ou modelo errado | conferir a URL base (sem `/chat/completions`) |
| `API de IA respondeu 429` | limite de uso/cota | aguardar ou trocar de provedor |
| `não retornou JSON válido` | modelo sem modo JSON | usar um modelo com `response_format: json_object` |
| `Tempo esgotado` (20s) | rede lenta / modelo grande | tentar modelo menor |
| `não passou na validação do esquema` | resposta fora do formato | repetir; se persistir, trocar de modelo |

Regra do projeto: **qualquer** falha resulta em `UNAVAILABLE`, o pedido é preservado e a
classificação vira manual. Nunca exibimos texto fixo como se fosse resultado de IA.
