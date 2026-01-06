const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const HARD_TIMEOUT_MS = 10000;

async function main() {
  const hardTimeout = setTimeout(() => {
    // eslint-disable-next-line no-console
    console.error(`timeout: exceeded ${HARD_TIMEOUT_MS}ms while checking DB`);
    process.exit(2);
  }, HARD_TIMEOUT_MS);

  const mode = process.argv[2] ?? "all"; // all | total | meaningFilled | filled

  const total = await prisma.tarotCard.count();
  const meaningFilled = await prisma.tarotCard.count({
    where: { uprightPoints: { not: "데이터 준비 중" } }
  });
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
  if (mode === "all") {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ total, meaningFilled, filled }));
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


