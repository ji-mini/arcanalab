const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const majorArcana = [
  { number: 0, nameEn: "The Fool", nameKo: "바보" },
  { number: 1, nameEn: "The Magician", nameKo: "마법사" },
  { number: 2, nameEn: "The High Priestess", nameKo: "여사제" },
  { number: 3, nameEn: "The Empress", nameKo: "여황제" },
  { number: 4, nameEn: "The Emperor", nameKo: "황제" },
  { number: 5, nameEn: "The Hierophant", nameKo: "교황" },
  { number: 6, nameEn: "The Lovers", nameKo: "연인" },
  { number: 7, nameEn: "The Chariot", nameKo: "전차" },
  { number: 8, nameEn: "Strength", nameKo: "힘" },
  { number: 9, nameEn: "The Hermit", nameKo: "은둔자" },
  { number: 10, nameEn: "Wheel of Fortune", nameKo: "운명의 수레바퀴" },
  { number: 11, nameEn: "Justice", nameKo: "정의" },
  { number: 12, nameEn: "The Hanged Man", nameKo: "매달린 사람" },
  { number: 13, nameEn: "Death", nameKo: "죽음" },
  { number: 14, nameEn: "Temperance", nameKo: "절제" },
  { number: 15, nameEn: "The Devil", nameKo: "악마" },
  { number: 16, nameEn: "The Tower", nameKo: "탑" },
  { number: 17, nameEn: "The Star", nameKo: "별" },
  { number: 18, nameEn: "The Moon", nameKo: "달" },
  { number: 19, nameEn: "The Sun", nameKo: "태양" },
  { number: 20, nameEn: "Judgement", nameKo: "심판" },
  { number: 21, nameEn: "The World", nameKo: "세계" }
];

const suits = [
  { suit: "WANDS", suitKo: "완드", suitEn: "Wands", baseKey: 100 },
  { suit: "CUPS", suitKo: "컵", suitEn: "Cups", baseKey: 200 },
  { suit: "SWORDS", suitKo: "소드", suitEn: "Swords", baseKey: 300 },
  { suit: "PENTACLES", suitKo: "펜타클", suitEn: "Pentacles", baseKey: 400 }
];

const ranks = [
  { rank: "ACE", rankKo: "에이스", rankEn: "Ace", offset: 1 },
  { rank: "TWO", rankKo: "2", rankEn: "Two", offset: 2 },
  { rank: "THREE", rankKo: "3", rankEn: "Three", offset: 3 },
  { rank: "FOUR", rankKo: "4", rankEn: "Four", offset: 4 },
  { rank: "FIVE", rankKo: "5", rankEn: "Five", offset: 5 },
  { rank: "SIX", rankKo: "6", rankEn: "Six", offset: 6 },
  { rank: "SEVEN", rankKo: "7", rankEn: "Seven", offset: 7 },
  { rank: "EIGHT", rankKo: "8", rankEn: "Eight", offset: 8 },
  { rank: "NINE", rankKo: "9", rankEn: "Nine", offset: 9 },
  { rank: "TEN", rankKo: "10", rankEn: "Ten", offset: 10 },
  { rank: "PAGE", rankKo: "페이지", rankEn: "Page", offset: 11 },
  { rank: "KNIGHT", rankKo: "나이트", rankEn: "Knight", offset: 12 },
  { rank: "QUEEN", rankKo: "퀸", rankEn: "Queen", offset: 13 },
  { rank: "KING", rankKo: "킹", rankEn: "King", offset: 14 }
];

function buildSeeds() {
  const majors = majorArcana.map((c) => ({
    nameEn: c.nameEn,
    nameKo: c.nameKo,
    arcana: "MAJOR",
    suit: null,
    rank: String(c.number),
    sortKey: c.number,
    keywords: [],
    description: "데이터 준비 중",
    uprightPoints: "데이터 준비 중",
    reversedPoints: "데이터 준비 중"
  }));

  const minors = suits.flatMap(({ suit, suitKo, suitEn, baseKey }) =>
    ranks.map((r) => ({
      nameEn: `${r.rankEn} of ${suitEn}`,
      nameKo: `${suitKo}의 ${r.rankKo}`,
      arcana: "MINOR",
      suit,
      rank: r.rank,
      sortKey: baseKey + r.offset,
      keywords: [],
      description: "데이터 준비 중",
      uprightPoints: "데이터 준비 중",
      reversedPoints: "데이터 준비 중"
    }))
  );

  return [...majors, ...minors];
}

async function main() {
  const existingCount = await prisma.tarotCard.count();
  if (existingCount > 0) {
    console.log(JSON.stringify({ ok: true, skipped: true, existingCount }));
    return;
  }

  const seeds = buildSeeds();
  await prisma.tarotCard.createMany({ data: seeds });
  console.log(JSON.stringify({ ok: true, inserted: seeds.length }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

