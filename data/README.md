# Dados do Recife — integração com o kit de dados do edital

## Fonte utilizada: OpenStreetMap

A solução usa **OpenStreetMap** (uma das bases do kit de dados oferecido pela
organização) de duas formas reais e verificáveis:

1. **Reconhecimento de região em tempo de execução (fonte primária).**
   O módulo `src/lib/regions.ts` consulta a API **Nominatim** do OpenStreetMap
   ao cadastrar pedidos e ofertas, para reconhecer e normalizar o bairro
   informado (ex.: "casa amarela" → "Casa Amarela, Recife"). O resultado é
   exibido ao usuário com a atribuição da fonte.

   Verificação manual (curl):

   ```bash
   curl -s "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&addressdetails=1&q=Casa%20Amarela,%20Recife,%20Pernambuco,%20Brasil"
   ```

2. **Catálogo offline de bairros (`data/bairros-recife.json`).**
   Usado para normalizar regiões quando a API externa não está disponível e
   para agregar os indicadores da Central de Mobilização por bairro/região.
   O arquivo contém a lista factual de bairros do município do Recife com a
   microrregião de planejamento. Para renovar o catálogo **diretamente do
   OpenStreetMap**, rode:

   ```bash
   node scripts/fetch-osm-bairros.mjs > data/bairros-recife.json
   ```

   O script usa a Overpass API com uma consulta documentada no próprio arquivo
   (nós `place=suburb|neighbourhood|quarter` dentro do limite administrativo
   do Recife).

## Como os dados influenciam a aplicação

- Campo "região/bairro" dos formulários é reconhecido e normalizado (nome
  canônico do bairro quando conhecido).
- Cartões do Match Solidário exibem a região aproximada normalizada.
- Os indicadores da Central são agregados por bairro e por microrregião.
- A fonte é exibida na interface ("Região reconhecida via OpenStreetMap").

## Atribuição

Dados geográficos © colaboradores do OpenStreetMap, licença
[ODbL 1.0](https://www.openstreetmap.org/copyright).

## Dados de demonstração

Registros marcados com "(DEMONSTRAÇÃO — fictício)" são inventados para o
cenário do hackathon e **não representam pessoas, famílias ou organizações
reais**.
