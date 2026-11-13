/**
 * Seed de demonstração — TODOS os registros são fictícios e identificados.
 * Uso: npm run seed
 */
import { getDb } from "../src/lib/db";
import { createRequest, reviewRequest, updateRequestStatus } from "../src/modules/requests/service";
import { createOffer } from "../src/modules/offers/service";
import { registerInterest, updateMatchByOrg } from "../src/modules/matching/service";
import { updateAttendance } from "../src/modules/mobilization/service";
import type { ClassifyFn } from "../src/modules/ai/classify";

const DEMO = "(DEMONSTRAÇÃO — fictício)";

// No seed não usamos IA: os dados são inventados e a classificação é registrada
// como MANUAL, para nunca apresentar texto fixo como resultado de IA.
const noAi: ClassifyFn = async () => ({
  status: "UNAVAILABLE",
  reason: "Registro de demonstração (seed) — classificação manual registrada."
});

async function main() {
  const db = await getDb();

  console.log("→ Cenário de demonstração: após chuva intensa no Recife...");
  const { request } = await createRequest(
    {
      name: `Família Souza ${DEMO}`,
      region: "Casa Amarela",
      category: "Colchões",
      item: "colchão",
      quantity: 2,
      description: "Perdemos nossos colchões no alagamento. Precisamos de dois colchões.",
      contactMethod: "retornar pela Central"
    },
    { db, classify: noAi }
  );
  await reviewRequest(request.id, { categoria: "Colchões", item: "colchão", quantity: 2 }, { db });
  await updateRequestStatus(request.id, "VALIDATED", { db });
  console.log(`  pedido validado: ${request.id}`);

  const offer = await createOffer(
    {
      name: `Doador Marcos ${DEMO}`,
      type: "DONATION",
      category: "Colchões",
      item: "colchão",
      quantity: 2,
      region: "Casa Amarela",
      availability: "sábado de manhã",
      description: "Tenho dois colchões em bom estado para doar."
    },
    { db }
  );
  console.log(`  oferta cadastrada: ${offer.id}`);

  const a = await registerInterest({ requestId: request.id, offerId: offer.id, who: "requester" }, { db });
  const b = await registerInterest({ requestId: request.id, offerId: offer.id, who: "provider" }, { db });
  const confirmed = await updateMatchByOrg(b.match.id, "CONFIRM", "Central (seed)", { db });
  await updateAttendance(confirmed.attendanceId!, "IN_PROGRESS", { db });
  await updateAttendance(confirmed.attendanceId!, "COMPLETED", { db });
  console.log(`  match confirmado e atendimento concluído: ${a.match.id}`);

  // Contexto extra para os cartões e indicadores (também fictício).
  const extras: Array<Parameters<typeof createRequest>[0]> = [
    {
      name: `Família Andrade ${DEMO}`,
      region: "Ibura",
      category: "Água",
      item: "galão de água",
      quantity: 4,
      description: "A água da nossa casa ficou contaminada depois da enchente. Precisamos de água potável.",
      contactMethod: "associação de moradores"
    },
    {
      name: `Seu Raimundo ${DEMO}`,
      region: "Boa Viagem",
      category: "Limpeza",
      item: "kit de limpeza",
      quantity: 3,
      description: "A lama entrou em casa e precisamos de material de limpeza para recuperar a casa.",
      contactMethod: "vizinha"
    }
  ];
  for (const input of extras) {
    const { request: r } = await createRequest(input, { db, classify: noAi });
    await reviewRequest(
      r.id,
      { categoria: input.category, item: input.item ?? null, quantity: input.quantity ?? null },
      { db }
    );
    await updateRequestStatus(r.id, "VALIDATED", { db });
    console.log(`  pedido extra validado: ${r.id}`);
  }

  await createOffer(
    {
      name: `Voluntária Ana ${DEMO}`,
      type: "VOLUNTEERING",
      category: "Apoio voluntário",
      item: "ajuda na limpeza",
      quantity: null,
      region: "Ibura",
      availability: "domingos",
      description: "Posso ajudar no mutirão de limpeza e na organização de doações."
    },
    { db }
  );
  await createOffer(
    {
      name: `Comércio do Bairro ${DEMO}`,
      type: "DONATION",
      category: "Água",
      item: "galão de água",
      quantity: 10,
      region: "Ibura",
      availability: "imediata",
      description: "Doamos galões de água potável para famílias afetadas."
    },
    { db }
  );

  console.log("✓ Seed concluído. Todos os registros são fictícios, para demonstração.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
