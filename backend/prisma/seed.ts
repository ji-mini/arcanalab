import { PrismaClient } from "@prisma/client";
import { buildTarotCardSeeds } from "./seed-data/tarot-cards";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const existingCount = await prisma.tarotCard.count();
  if (existingCount > 0) {
    return;
  }

  const seeds = buildTarotCardSeeds();
  await prisma.tarotCard.createMany({ data: seeds });
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


