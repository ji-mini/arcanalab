const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function isBlank(v) {
  return String(v ?? "").trim().length === 0;
}

async function main() {
  // reversedPoints가 빈 문자열/null인 케이스를 안전한 placeholder로 채웁니다.
  // (실데이터가 없는 카드도 UI가 비어보이지 않도록)
  const blanks = await prisma.tarotCard.findMany({
    where: {
      OR: [{ reversedPoints: null }, { reversedPoints: "" }]
    },
    select: { id: true, nameEn: true, nameKo: true, reversedPoints: true }
  });

  let updated = 0;
  for (const c of blanks) {
    if (!isBlank(c.reversedPoints)) continue;
    // eslint-disable-next-line no-await-in-loop
    await prisma.tarotCard.update({
      where: { id: c.id },
      data: { reversedPoints: "—" }
    });
    updated += 1;
  }

  console.log(JSON.stringify({ blanks: blanks.length, updated }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

