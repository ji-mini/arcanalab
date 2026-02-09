const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function looksEnglish(s) {
  const t = String(s || "");
  if (!t) return false;
  const hasHangul = /[가-힣]/.test(t);
  const hasLatin = /[A-Za-z]/.test(t);
  return hasLatin && !hasHangul;
}

function nonEmptyOrFallback(value, fallback) {
  const t = String(value ?? "").trim();
  return t ? t : fallback;
}

async function openAiTranslateToKo(payload) {
  const schemaHint = {
    keywordsKo: ["키워드1", "키워드2"],
    descriptionKo: "기본 설명(자연스러운 한글)",
    uprightPointsKo: "정방향 포인트(자연스러운 한글)",
    reversedPointsKo: "역방향 포인트(자연스러운 한글)"
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0,
      top_p: 1,
      messages: [
        {
          role: "system",
          content: [
            "You translate tarot card meanings into natural Korean.",
            "Return ONLY valid JSON. No extra text.",
            "Keep it readable and concise, but not overly short.",
            "Do not invent facts beyond the given English text.",
            `Output JSON schema example: ${JSON.stringify(schemaHint)}`
          ].join("\n")
        },
        { role: "user", content: JSON.stringify(payload) }
      ]
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI translate failed: ${res.status} ${text}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content ?? "";
  try {
    return JSON.parse(content);
  } catch {
    throw new Error(`OpenAI returned non-JSON: ${content.slice(0, 200)}`);
  }
}

async function translateOne(card) {
  const payload = {
    card: { id: card.id, nameKo: card.nameKo, nameEn: card.nameEn },
    keywordsEn: card.keywords ?? [],
    descriptionEn: card.description,
    uprightPointsEn: card.uprightPoints,
    reversedPointsEn: card.reversedPoints
  };

  const out = await openAiTranslateToKo(payload);

  const nextKeywords = Array.isArray(out.keywordsKo)
    ? out.keywordsKo
    : Array.isArray(out.keywords)
      ? out.keywords
      : [];

  const nextDescription = nonEmptyOrFallback(out.descriptionKo || out.description, card.description);
  const nextUpright = nonEmptyOrFallback(out.uprightPointsKo || out.uprightPoints, card.uprightPoints);
  // 번역 결과가 비어있으면 기존 값을 유지하고, 기존도 비어있으면 최소 placeholder로 채웁니다.
  const nextReversed = nonEmptyOrFallback(out.reversedPointsKo || out.reversedPoints, nonEmptyOrFallback(card.reversedPoints, "—"));

  await prisma.tarotCard.update({
    where: { id: card.id },
    data: {
      keywords: nextKeywords.map((x) => String(x).trim()).filter(Boolean).slice(0, 12),
      description: String(nextDescription),
      uprightPoints: String(nextUpright),
      reversedPoints: String(nextReversed)
    }
  });
}

async function main() {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required to translate 카드 설명을 한글로 업데이트합니다.");
  }

  const cards = await prisma.tarotCard.findMany({
    orderBy: [{ sortKey: "asc" }],
    select: {
      id: true,
      nameEn: true,
      nameKo: true,
      keywords: true,
      description: true,
      uprightPoints: true,
      reversedPoints: true
    }
  });

  const targets = cards.filter((c) => looksEnglish(c.description) || looksEnglish(c.uprightPoints) || looksEnglish(c.reversedPoints));
  console.log(JSON.stringify({ total: cards.length, targets: targets.length }));

  let ok = 0;
  let fail = 0;
  for (const c of targets) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await translateOne(c);
      ok += 1;
      console.log(`[ok] ${ok}/${targets.length} ${c.nameEn}`);
    } catch (e) {
      fail += 1;
      console.warn(`[fail] ${c.nameEn}: ${String(e?.message ?? e)}`);
    }
    // eslint-disable-next-line no-await-in-loop
    await sleep(350);
  }

  console.log(JSON.stringify({ ok, fail }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

