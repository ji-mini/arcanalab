const fs = require("node:fs");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const IMAGE_EXTS = [".webp", ".png", ".jpg", ".jpeg"];

function slugifyEn(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function pad2(n) {
  const s = String(n);
  return s.length >= 2 ? s : `0${s}`;
}

function buildSlug(card) {
  if (card.arcana === "MAJOR") {
    const num = Number(card.rank ?? "0");
    const nn = Number.isFinite(num) ? pad2(num) : "00";
    return `major-${nn}-${slugifyEn(card.nameEn)}`;
  }
  const suit = String(card.suit ?? "").toLowerCase();
  const rank = String(card.rank ?? "").toLowerCase();
  return `minor-${suit}-${rank}`;
}

function findExistingFile(baseDir, slug) {
  for (const ext of IMAGE_EXTS) {
    const p = path.join(baseDir, `${slug}${ext}`);
    if (fs.existsSync(p)) return { filePath: p, ext };
  }
  return null;
}

async function main() {
  const publicDir = path.join(process.cwd(), "public");
  const thumbDir = path.join(publicDir, "cards", "thumb");
  const fullDir = path.join(publicDir, "cards", "full");

  const cards = await prisma.tarotCard.findMany({
    select: {
      id: true,
      nameEn: true,
      arcana: true,
      suit: true,
      rank: true,
      thumbnailUrl: true,
      imageUrl: true
    }
  });

  let updated = 0;

  for (const c of cards) {
    const slug = buildSlug(c);
    const thumb = findExistingFile(thumbDir, slug);
    const full = findExistingFile(fullDir, slug);

    // 파일이 존재하는 경우에만 URL을 업데이트합니다.
    const nextThumbUrl = thumb ? `/assets/cards/thumb/${slug}${thumb.ext}` : null;
    const nextFullUrl = full ? `/assets/cards/full/${slug}${full.ext}` : null;

    if (!nextThumbUrl && !nextFullUrl) continue;

    const data = {};
    if (nextThumbUrl) data.thumbnailUrl = nextThumbUrl;
    if (nextFullUrl) data.imageUrl = nextFullUrl;

    await prisma.tarotCard.update({ where: { id: c.id }, data });
    updated += 1;
  }

  console.log(JSON.stringify({ total: cards.length, updated }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




