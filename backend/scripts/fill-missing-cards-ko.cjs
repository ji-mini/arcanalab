const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isPlaceholder(v) {
  const t = String(v ?? "").trim();
  return (
    t.length === 0 ||
    t === "-" ||
    t === "—" ||
    t === "데이터 준비 중"
  );
}

function hasHangul(v) {
  return /[가-힣]/.test(String(v ?? ""));
}

async function openAiFillOne(payload) {
  const schemaHint = {
    // 5~12개
    keywordsKo: ["키워드1", "키워드2"],
    // 각 3~7문장 정도 권장
    descriptionKo: "카드 기본 설명(한글)",
    uprightPointsKo: "정방향 포인트(한글)",
    reversedPointsKo: "역방향 포인트(한글)"
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.2,
      top_p: 1,
      messages: [
        {
          role: "system",
          content: [
            "You are a tarot writing assistant.",
            "Goal: Fill missing Korean tarot card text fields for a database.",
            "Use the provided card metadata and existing text as the primary basis.",
            "If reversed meaning is missing, infer a reasonable reversed interpretation from upright meaning and common tarot principles.",
            "Write in natural Korean, informative, not overly poetic.",
            "Return ONLY valid JSON. No extra text.",
            `Output JSON schema example: ${JSON.stringify(schemaHint)}`
          ].join("\n")
        },
        { role: "user", content: JSON.stringify(payload) }
      ]
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI fill failed: ${res.status} ${text}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content ?? "";
  try {
    return JSON.parse(content);
  } catch {
    throw new Error(`OpenAI returned non-JSON: ${content.slice(0, 200)}`);
  }
}

function normalizeKeywords(arr) {
  if (!Array.isArray(arr)) return [];
  const out = [];
  for (const v of arr) {
    const t = String(v ?? "").trim();
    if (!t) continue;
    if (t.length > 40) continue;
    if (out.includes(t)) continue;
    out.push(t);
    if (out.length >= 12) break;
  }
  return out;
}

async function main() {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required to fill missing Korean card fields.");
  }

  const cards = await prisma.tarotCard.findMany({
    orderBy: [{ sortKey: "asc" }],
    select: {
      id: true,
      nameEn: true,
      nameKo: true,
      arcana: true,
      suit: true,
      rank: true,
      keywords: true,
      description: true,
      uprightPoints: true,
      reversedPoints: true
    }
  });

  const targets = cards.filter((c) => {
    const kwEmpty = !Array.isArray(c.keywords) || c.keywords.length === 0;
    // "한글이 들어있는데 '-'만 있는" 케이스를 포함해 누락 감지
    const descMissing = isPlaceholder(c.description);
    const upMissing = isPlaceholder(c.uprightPoints);
    const revMissing = isPlaceholder(c.reversedPoints);

    // 영어만 있는 경우도 한글로 채울 대상에 포함
    const descNoKo = !hasHangul(c.description);
    const upNoKo = !hasHangul(c.uprightPoints);
    const revNoKo = !hasHangul(c.reversedPoints) && !isPlaceholder(c.reversedPoints);

    return (
      kwEmpty ||
      descMissing ||
      upMissing ||
      revMissing ||
      descNoKo ||
      upNoKo ||
      revNoKo
    );
  });

  console.log(JSON.stringify({ total: cards.length, targets: targets.length }, null, 2));

  let ok = 0;
  let fail = 0;

  for (const c of targets) {
    const payload = {
      card: {
        id: c.id,
        nameKo: c.nameKo,
        nameEn: c.nameEn,
        arcana: c.arcana,
        suit: c.suit,
        rank: c.rank
      },
      // 기존값(있으면 참고)
      existing: {
        keywords: c.keywords ?? [],
        description: c.description,
        uprightPoints: c.uprightPoints,
        reversedPoints: c.reversedPoints
      },
      // 작성 규칙
      rules: {
        keywords: "5~12개, 짧게, 중복 제거",
        description: "3~7문장",
        uprightPoints: "3~7문장",
        reversedPoints: "3~7문장 (없으면 정방향을 반전/내면화/지연 관점으로 구성)"
      }
    };

    try {
      // eslint-disable-next-line no-await-in-loop
      const out = await openAiFillOne(payload);

      const nextKeywords = normalizeKeywords(out.keywordsKo ?? out.keywords ?? c.keywords ?? []);
      const nextDescription = String(out.descriptionKo ?? out.description ?? c.description ?? "").trim();
      const nextUpright = String(out.uprightPointsKo ?? out.uprightPoints ?? c.uprightPoints ?? "").trim();
      const nextReversed = String(out.reversedPointsKo ?? out.reversedPoints ?? c.reversedPoints ?? "").trim();

      // 최소 안전장치
      if (!nextDescription || !nextUpright || !nextReversed) {
        throw new Error("OpenAI output missing required fields.");
      }

      // eslint-disable-next-line no-await-in-loop
      await prisma.tarotCard.update({
        where: { id: c.id },
        data: {
          keywords: nextKeywords.length ? nextKeywords : c.keywords,
          description: nextDescription,
          uprightPoints: nextUpright,
          reversedPoints: nextReversed
        }
      });

      ok += 1;
      console.log(`[ok] ${ok}/${targets.length} ${c.nameEn}`);
    } catch (e) {
      fail += 1;
      console.warn(`[fail] ${c.nameEn}: ${String(e?.message ?? e)}`);
    }

    // eslint-disable-next-line no-await-in-loop
    await sleep(400);
  }

  console.log(JSON.stringify({ ok, fail }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

