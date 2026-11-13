# Pitch de 3 minutos — Rede Solidária Inteligente

> Roteiro sugerido com demonstração ao vivo. Revisar após a validação com o jovem
> do Movimento Pró-Criança (incluir 1 frase com o feedback real dele).

---

## 🎬 Roteiro (3:00)

### Abertura — o problema (0:00–0:30)

> "Em maio de 2022, as chuvas extremas deixaram mais de 120 mortos em Pernambuco.
> Depois da tragédia, a ajuda chega — mas chega desorganizada: pedidos e doações
> espalhados em grupos de WhatsApp, sem saber quem precisa de quê.
> **Nós somos a antena na lama**: tecnologia conectada ao território."

### Demonstração ao vivo (0:30–2:00) — o fluxo §15

Rodar o cenário no deploy público (celular de preferência — mostra o mobile-first):

1. **(0:30)** `/solicitar-ajuda` — família registra: *"Perdemos nossos colchões no alagamento. Precisamos de dois colchões."*
2. **(0:45)** A IA interpreta a descrição → sugere `Colchões · colchão · qtd 2` — e mostra a **correção humana**: *"a IA sugere, a pessoa decide"* (mostrar o registro de auditoria original × corrigido).
3. **(1:00)** `/central` — organização **valida** o pedido (mostrar indicadores nascendo dos dados reais).
4. **(1:10)** `/oferecer-ajuda` — doador cadastra 2 colchões.
5. **(1:20)** `/match` — o cartão aparece **com a explicação**: *"Esta oferta é compatível porque disponibiliza colchão (quantidade 2) e atende à categoria solicitada. Região aproximada compatível."* → **Swipe/botão de interesse** dos dois lados.
6. **(1:40)** Central **confirma** → atendimento → **conclui** → pedido vira "Atendido".

### Indicador de resultado (2:00–2:30)

> "Nosso indicador: **percentual de pedidos validados que tiveram atendimento concluído.**
> Cada número vem do banco — nada de número bonito falso. Registros de demonstração
> são identificados como fictícios."

### Fechamento — IA com propósito + futuro (2:30–3:00)

> "A IA tem papel essencial — interpreta relatos em linguagem natural — mas **nunca
> decide sozinha**: toda classificação passa por auditoria humana e validação da
> organização. Usamos dados do OpenStreetMap para entender bairros e regiões.
> Próximos passos: WhatsApp, priorização assistida e integração com Defesa Civil.
> Rede Solidária Inteligente: conectando pessoas, organizando a solidariedade,
> reconstruindo comunidades."

---

## ✅ Checklist do demo (testar ANTES do pitch)

- [ ] `OPENAI_API_KEY` configurada no deploy (passo 2 com IA real)
- [ ] Seed limpo ou banco novo (indicadores começam zerados e "nascem" na demo)
- [ ] Logins abertos em abas separadas: `/solicitar-ajuda`, `/central` (logada), `/match`
- [ ] Celular carregado com o deploy aberto (prova do mobile-first)
- [ ] Timer na mão — ensaiar 2x (corta o que passar de 2:45)
- [ ] Plano B: se a internet falhar, screenshots do fluxo nos slides

## 💬 Perguntas prováveis da banca

| Pergunta | Resposta |
|---|---|
| "E se a IA errar?" | Auditoria humana obrigatória: original × corrigido registrado; sem IA o fluxo continua manual com aviso honesto. |
| "Como sabem que a compatibilidade é real?" | Regras objetivas no backend (categoria × item × quantidade × região) — texto de IA nunca é a única evidência. |
| "Isso substitui a Defesa Civil?" | Não. Organizações validam tudo; o sistema organiza solidariedade, não é canal de emergência. |
| "Qual o dado do kit?" | OpenStreetMap: Nominatim em execução + catálogo de bairros + script Overpass documentado e verificável. |
