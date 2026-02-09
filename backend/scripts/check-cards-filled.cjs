const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const HARD_TIMEOUT_MS = 10000;

async function main() {
  const hardTimeout = setTimeout(() => {
    // eslint-disable-next-line no-console
    console.error(`timeout: exceeded ${HARD_TIMEOUT_MS}ms while checking DB`);
    process.exit(2);
  }, HARD_TIMEOUT_MS);

  const mode = process.argv[2] ?? "all"; // all | total | meaningFilled | koreanMeaningFilled | filled

  const total = await prisma.tarotCard.count();
  const meaningFilled = await prisma.tarotCard.count({
    where: { uprightPoints: { not: "데이터 준비 중" } }
  });

  // "한글 의미가 채워졌는지"는 DB 필터로 정확히 하기 어려워서(문자 범위),
  // 78건만 메모리로 가져와 정규식으로 체크합니다.
  const cards = await prisma.tarotCard.findMany({
    select: { uprightPoints: true, description: true, reversedPoints: true }
  });
  const koreanMeaningFilled = cards.filter((c) => {
    const up = String(c.uprightPoints ?? "");
    const desc = String(c.description ?? "");
    const rev = String(c.reversedPoints ?? "");
    if (up === "데이터 준비 중" || desc === "데이터 준비 중") return false;
    const hasHangul = /[가-힣]/.test(up) || /[가-힣]/.test(desc) || /[가-힣]/.test(rev);
    return hasHangul;
  }).length;
  const filled = await prisma.tarotCard.count({
    where: {
      AND: [
        { thumbnailUrl: { not: null } },
        { imageUrl: { not: null } },
        { uprightPoints: { not: "데이터 준비 중" } }
      ]
    }
  });

  let out = filled;
  if (mode === "total") out = total;
  if (mode === "meaningFilled") out = meaningFilled;
  if (mode === "koreanMeaningFilled") out = koreanMeaningFilled;
  if (mode === "all") {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ total, meaningFilled, koreanMeaningFilled, filled }));
  } else {
    // eslint-disable-next-line no-console
    console.log(out);
  }

  clearTimeout(hardTimeout);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


