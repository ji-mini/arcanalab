import { PrismaClient } from "@prisma/client";
import { buildTarotCardSeeds } from "./seed-data/tarot-cards";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const existingCount = await prisma.tarotCard.count();
  if (existingCount === 0) {
    const seeds = buildTarotCardSeeds();
    await prisma.tarotCard.createMany({ data: seeds });
  }

  // 이미지 URL 백필(이미지 파일이 없어도 UI에서 카드 이미지를 볼 수 있도록 SVG 엔드포인트를 사용)
  const cards = await prisma.tarotCard.findMany({
    select: { id: true, thumbnailUrl: true, imageUrl: true }
  });

  const updates = cards
    .filter((c) => !c.thumbnailUrl || !c.imageUrl)
    .map((c) =>
      prisma.tarotCard.update({
        where: { id: c.id },
        data: {
          thumbnailUrl: c.thumbnailUrl ?? `/api/cards/${c.id}/thumbnail.svg`,
          imageUrl: c.imageUrl ?? `/api/cards/${c.id}/image.svg`
        }
      })
    );

  if (updates.length > 0) {
    await prisma.$transaction(updates);
  }
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


