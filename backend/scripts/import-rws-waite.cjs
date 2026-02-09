const https = require("node:https");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
// Waite 텍스트는 PD로 명시된 소스를 사용합니다.
// - Project Gutenberg #43548 (UTF-8 plain text)
const GUTENBERG_TEXT_URL = "https://www.gutenberg.org/cache/epub/43548/pg43548.txt";

const SUIT_FILE_PREFIX = {
  WANDS: "Wands",
  CUPS: "Cups",
  SWORDS: "Swords",
  PENTACLES: "Pents"
};

const SUIT_EN = {
  WANDS: "Wands",
  CUPS: "Cups",
  SWORDS: "Swords",
  PENTACLES: "Pentacles"
};

const RANK_TO_NUMBER = {
  ACE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
  SIX: 6,
  SEVEN: 7,
  EIGHT: 8,
  NINE: 9,
  TEN: 10,
  PAGE: 11,
  KNIGHT: 12,
  QUEEN: 13,
  KING: 14
};

function pad2(n) {
  const s = String(n);
  return s.length >= 2 ? s : `0${s}`;
}

function httpGetText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "arcana-lab/0.0 (ec2 import)" } }, (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          resolve({
            statusCode: res.statusCode ?? 0,
            headers: res.headers ?? {},
            bodyText: buf.toString("utf-8")
          });
        });
      })
      .on("error", reject);
  });
}

async function httpGetJson(url) {
  const res = await httpGetText(url);
  const ct = String(res.headers?.["content-type"] ?? "");
  const text = res.bodyText ?? "";

  if (res.statusCode < 200 || res.statusCode >= 300) {
    const head = text.slice(0, 200).replace(/\s+/g, " ");
    throw new Error(`HTTP ${res.statusCode} (non-2xx) ct=${ct} bodyHead=${JSON.stringify(head)}`);
  }

  // Commons가 일시적으로 HTML 에러 페이지를 주는 경우가 있어 방어
  if (!ct.includes("json") && text.trim().startsWith("<")) {
    const head = text.slice(0, 200).replace(/\s+/g, " ");
    throw new Error(`Non-JSON response ct=${ct} bodyHead=${JSON.stringify(head)}`);
  }

  return JSON.parse(text);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function httpGetJsonWithRetry(url, opts) {
  const retries = opts?.retries ?? 6;
  const baseDelayMs = opts?.baseDelayMs ?? 400;

  let lastErr = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await httpGetJson(url);
    } catch (e) {
      lastErr = e;
      const msg = String(e?.message ?? e);
      const retryable =
        msg.includes("HTTP 429") ||
        msg.includes("HTTP 500") ||
        msg.includes("HTTP 502") ||
        msg.includes("HTTP 503") ||
        msg.includes("HTTP 504") ||
        msg.includes("Non-JSON response") ||
        msg.includes("Unexpected token <");

      if (!retryable || attempt === retries) break;

      const delay = Math.min(8000, baseDelayMs * Math.pow(2, attempt));
      console.warn(`[warn] retrying commons api (attempt ${attempt + 1}/${retries}) in ${delay}ms: ${msg}`);
      // eslint-disable-next-line no-await-in-loop
      await sleep(delay);
    }
  }
  throw lastErr;
}

function normalizeGutenbergText(text) {
  return String(text).replace(/\r/g, "").replace(/_/g, "");
}

function commonsFileTitle(card) {
  if (card.arcana === "MAJOR") {
    const num = Number(card.rank ?? "0");
    const nn = Number.isFinite(num) ? pad2(num) : "00";
    const nameToken = String(card.nameEn)
      .replace(/^The\s+/i, "")
      .trim()
      .replace(/\s+/g, "_");
    return `RWS_Tarot_${nn}_${nameToken}.jpg`;
  }

  // Commons에서 Wands09.jpg는 삭제되고 Tarot_Nine_of_Wands.jpg가 사용됩니다.
  if (card.suit === "WANDS" && card.rank === "NINE") {
    return "Tarot_Nine_of_Wands.jpg";
  }

  const suitPrefix = SUIT_FILE_PREFIX[card.suit];
  const n = RANK_TO_NUMBER[card.rank];
  return `${suitPrefix}${pad2(n)}.jpg`;
}

async function fetchCommonsImageUrls(fileName, widths) {
  const title = `File:${fileName}`;
  const results = {};

  for (const w of widths) {
    const url =
      `${COMMONS_API}?action=query&format=json&origin=*` +
      `&titles=${encodeURIComponent(title)}` +
      `&prop=imageinfo&iiprop=url&iiurlwidth=${w}`;
    const json = await httpGetJsonWithRetry(url, { retries: 6, baseDelayMs: 400 });
    const pages = json?.query?.pages ?? {};
    const page = Object.values(pages)[0];
    if (!page || page.missing) {
      return { ok: false, reason: "missing", fileName };
    }
    const ii = page.imageinfo?.[0];
    if (!ii) {
      return { ok: false, reason: "no_imageinfo", fileName };
    }
    results[w] = ii.thumburl ?? ii.url;
    results.original = ii.url;
  }

  return { ok: true, fileName, urls: results };
}

function splitReversed(text) {
  const idx = text.indexOf("Reversed:");
  if (idx < 0) return { upright: text.trim(), reversed: "" };
  const upright = text.slice(0, idx).trim().replace(/[—-]\s*$/, "").trim();
  const reversed = text.slice(idx + "Reversed:".length).trim();
  return { upright, reversed };
}

function nonEmptyOrFallback(value, fallback) {
  const t = String(value ?? "").trim();
  return t ? t : fallback;
}

function buildKeywords(upright) {
  const parts = upright
    .split(/[;,]/g)
    .map((s) => s.trim())
    .filter(Boolean);

  const uniq = [];
  for (const p of parts) {
    const normalized = p.replace(/\.$/, "").trim();
    if (!normalized) continue;
    if (normalized.length > 40) continue;
    if (uniq.includes(normalized)) continue;
    uniq.push(normalized);
    if (uniq.length >= 8) break;
  }
  return uniq;
}

function majorHeadingMarker(card) {
  const n = Number(card.rank ?? "0");
  if (!Number.isFinite(n)) return null;

  // Project Gutenberg #43548(43548) 기준 표기.
  // 예: "ZERO. THE FOOL", "EIGHT. STRENGTH, OR FORTITUDE", "TEN. WHEEL OF FORTUNE"
  const numberWord = [
    "ZERO",
    "ONE",
    "TWO",
    "THREE",
    "FOUR",
    "FIVE",
    "SIX",
    "SEVEN",
    "EIGHT",
    "NINE",
    "TEN",
    "ELEVEN",
    "TWELVE",
    "THIRTEEN",
    "FOURTEEN",
    "FIFTEEN",
    "SIXTEEN",
    "SEVENTEEN",
    "EIGHTEEN",
    "NINETEEN",
    "TWENTY",
    "TWENTY-ONE"
  ][n];
  if (!numberWord) return null;

  if (n === 0) return "ZERO. THE FOOL";
  if (n === 8) return "EIGHT. STRENGTH, OR FORTITUDE";
  if (n === 10) return "TEN. WHEEL OF FORTUNE";
  if (n === 20) return "TWENTY. THE LAST JUDGMENT";
  if (n === 21) return "TWENTY-ONE. THE WORLD";

  return `${numberWord}. ${String(card.nameEn).toUpperCase()}`;
}

function minorRankWord(rank) {
  const map = {
    ACE: "Ace",
    TWO: "Two",
    THREE: "Three",
    FOUR: "Four",
    FIVE: "Five",
    SIX: "Six",
    SEVEN: "Seven",
    EIGHT: "Eight",
    NINE: "Nine",
    TEN: "Ten",
    PAGE: "Page",
    KNIGHT: "Knight",
    QUEEN: "Queen",
    KING: "King"
  };
  return map[String(rank ?? "")] ?? null;
}

function normalizeMeaningBlock(raw) {
  return String(raw)
    .replace(/^["“”]+/, "")
    .replace(/["“”]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMajorMeaningsFromGutenberg(text, cardsInOrder) {
  const upper = text.toUpperCase();
  const majors = cardsInOrder.filter((c) => c.arcana === "MAJOR");
  const markers = majors
    .map((c) => {
      const marker = majorHeadingMarker(c);
      if (!marker) return null;
      return { id: c.id, marker, idx: upper.indexOf(marker) };
    })
    .filter(Boolean)
    .filter((m) => m.idx >= 0)
    .sort((a, b) => a.idx - b.idx);

  const map = new Map();
  for (let i = 0; i < markers.length; i += 1) {
    const cur = markers[i];
    const next = markers[i + 1];
    const start = cur.idx + cur.marker.length;
    const end = next ? next.idx : text.length;
    const raw = text.slice(start, end).trim();
    const cleaned = normalizeMeaningBlock(raw);
    const split = splitReversed(cleaned);
    map.set(cur.id, {
      upright: split.upright,
      reversed: split.reversed,
      keywords: buildKeywords(split.upright)
    });
  }
  return map;
}

function extractMinorMeaningsFromGutenberg(text, cardsInOrder, majorWorldMarkerIdx) {
  const upper = text.toUpperCase();
  const start = upper.indexOf("SOME ADDITIONAL MEANINGS OF THE LESSER ARCANA", Math.max(0, majorWorldMarkerIdx));
  if (start < 0) return new Map();
  const end = upper.indexOf("THE RECURRENCE OF CARDS IN DEALING", start);
  const section = text.slice(start, end > 0 ? end : text.length);
  const sectionUpper = section.toUpperCase();

  const suits = ["WANDS", "CUPS", "SWORDS", "PENTACLES"];
  const suitStarts = suits
    .map((s) => ({ suit: s, idx: sectionUpper.indexOf(`${s}.`) }))
    .filter((x) => x.idx >= 0)
    .sort((a, b) => a.idx - b.idx);

  const suitBlocks = new Map();
  for (let i = 0; i < suitStarts.length; i += 1) {
    const cur = suitStarts[i];
    const next = suitStarts[i + 1];
    const sStart = cur.idx;
    const sEnd = next ? next.idx : section.length;
    suitBlocks.set(cur.suit, section.slice(sStart, sEnd));
  }

  const minors = cardsInOrder.filter((c) => c.arcana === "MINOR" && c.suit && c.rank);
  const map = new Map();

  for (const suit of suits) {
    const block = suitBlocks.get(suit);
    if (!block) continue;
    const blockUpper = block.toUpperCase();

    const rankMarkers = minors
      .filter((c) => c.suit === suit)
      .map((c) => {
        const word = minorRankWord(c.rank);
        if (!word) return null;
        const marker = `${word}.--`;
        const idx = blockUpper.indexOf(marker.toUpperCase());
        if (idx < 0) return null;
        return { id: c.id, marker, idx };
      })
      .filter(Boolean)
      .sort((a, b) => a.idx - b.idx);

    for (let i = 0; i < rankMarkers.length; i += 1) {
      const cur = rankMarkers[i];
      const next = rankMarkers[i + 1];
      const startIdx = cur.idx + cur.marker.length;
      const endIdx = next ? next.idx : block.length;
      const raw = block.slice(startIdx, endIdx).trim();
      const cleaned = normalizeMeaningBlock(raw);
      const split = splitReversed(cleaned);
      map.set(cur.id, {
        upright: split.upright,
        reversed: split.reversed,
        keywords: buildKeywords(split.upright)
      });
    }
  }

  return map;
}

function extractCardMeaningMapFromGutenberg(rawText, cardsInOrder) {
  const text = normalizeGutenbergText(rawText);
  const majorMap = extractMajorMeaningsFromGutenberg(text, cardsInOrder);

  // 마이너 섹션은 보통 메이저 21번(The World) 이후에 이어집니다.
  const worldMarkerIdx = text.toUpperCase().indexOf("TWENTY-ONE. THE WORLD");
  const minorMap = extractMinorMeaningsFromGutenberg(text, cardsInOrder, worldMarkerIdx);

  const merged = new Map();
  for (const [k, v] of majorMap.entries()) merged.set(k, v);
  for (const [k, v] of minorMap.entries()) merged.set(k, v);
  return merged;
}

async function main() {
  const cards = await prisma.tarotCard.findMany({
    orderBy: [{ sortKey: "asc" }],
    select: {
      id: true,
      nameEn: true,
      nameKo: true,
      arcana: true,
      suit: true,
      rank: true,
      sortKey: true,
      thumbnailUrl: true,
      imageUrl: true,
      uprightPoints: true
    }
  });

  if (cards.length !== 78) {
    console.warn(`[warn] expected 78 cards, got ${cards.length}`);
  }

  console.log("[1/4] fetching waite meanings from Project Gutenberg (pg43548.txt)...");
  const bookRes = await httpGetText(GUTENBERG_TEXT_URL);
  const bookText = bookRes.bodyText ?? "";
  const meaningMap = extractCardMeaningMapFromGutenberg(bookText, cards);
  console.log(`[1/4] meanings extracted: ${meaningMap.size} items`);

  console.log("[2/4] writing meanings to DB...");
  const meaningUpdates = [];
  for (const c of cards) {
    const meanings = meaningMap.get(c.id);
    if (!meanings) continue;
    // 이미 의미가 채워진 경우(수동 편집 등) 덮어쓰지 않습니다.
    if (c.uprightPoints && c.uprightPoints !== "데이터 준비 중") continue;
    meaningUpdates.push(
      prisma.tarotCard.update({
        where: { id: c.id },
        data: {
          description: nonEmptyOrFallback(meanings.upright, "데이터 준비 중"),
          uprightPoints: nonEmptyOrFallback(meanings.upright, "데이터 준비 중"),
          reversedPoints: nonEmptyOrFallback(meanings.reversed, "—"),
          keywords: meanings.keywords
        }
      })
    );
  }

  if (meaningUpdates.length > 0) {
    const chunkSize = 25;
    for (let i = 0; i < meaningUpdates.length; i += chunkSize) {
      // eslint-disable-next-line no-await-in-loop
      await prisma.$transaction(meaningUpdates.slice(i, i + chunkSize));
    }
  }
  console.log(`[2/4] meanings updated: ${meaningUpdates.length}`);

  // 선택: 의미 텍스트가 영어인 경우, OpenAI로 한글 번역하여 DB에 저장합니다.
  // 카드 설명 보기 화면은 OpenAI를 호출하지 않고 DB만 읽으므로, 여기서 "1회 변환"을 수행합니다.
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

  function looksEnglish(s) {
    const t = String(s || "");
    if (!t) return false;
    const hasHangul = /[가-힣]/.test(t);
    const hasLatin = /[A-Za-z]/.test(t);
    return hasLatin && !hasHangul;
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
          {
            role: "user",
            content: JSON.stringify(payload)
          }
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

  // 번역은 비용이 드는 작업이므로 기본적으로는 수행하지 않습니다.
  // 필요 시 별도 스크립트(`scripts/translate-cards-ko.cjs`)를 실행하세요.
  // (또는 TRANSLATE_CARDS_KO=1 로 이 단계 활성화)
  if (OPENAI_API_KEY && process.env.TRANSLATE_CARDS_KO === "1") {
    console.log("[2.5/4] translating meanings to Korean via OpenAI (only when English)...");
    const cardsForTranslate = await prisma.tarotCard.findMany({
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

    let translated = 0;
    for (const c of cardsForTranslate) {
      if (!looksEnglish(c.uprightPoints) && !looksEnglish(c.description) && !looksEnglish(c.reversedPoints)) continue;

      const payload = {
        card: { id: c.id, nameKo: c.nameKo, nameEn: c.nameEn },
        keywordsEn: c.keywords ?? [],
        descriptionEn: c.description,
        uprightPointsEn: c.uprightPoints,
        reversedPointsEn: c.reversedPoints
      };

      let out;
      try {
        // eslint-disable-next-line no-await-in-loop
        out = await openAiTranslateToKo(payload);
      } catch (e) {
        console.warn(`[warn] translate failed for ${c.nameEn}: ${String(e?.message ?? e)}`);
        // eslint-disable-next-line no-await-in-loop
        await sleep(500);
        continue;
      }

      const nextKeywords = Array.isArray(out.keywordsKo) ? out.keywordsKo : Array.isArray(out.keywords) ? out.keywords : [];
      const nextDescription = out.descriptionKo || out.description || c.description;
      const nextUpright = out.uprightPointsKo || out.uprightPoints || c.uprightPoints;
      const nextReversed = out.reversedPointsKo || out.reversedPoints || c.reversedPoints;

      // eslint-disable-next-line no-await-in-loop
      await prisma.tarotCard.update({
        where: { id: c.id },
        data: {
          keywords: nextKeywords.map((x) => String(x).trim()).filter(Boolean).slice(0, 12),
          description: String(nextDescription),
          uprightPoints: String(nextUpright),
          reversedPoints: String(nextReversed)
        }
      });
      translated += 1;

      // eslint-disable-next-line no-await-in-loop
      await sleep(350);
    }

    console.log(`[2.5/4] translated: ${translated}`);
  } else {
    console.log("[2.5/4] skip Korean translation (set TRANSLATE_CARDS_KO=1 to enable)");
  }

  console.log("[3/4] fetching image URLs from Wikimedia Commons...");
  const THUMB_W = 240;
  let imageOk = 0;
  let imageMissing = 0;
  let imageError = 0;
  const imageMissingFiles = [];

  const imageUpdates = [];

  for (const c of cards) {
    // 이미 이미지가 채워져 있으면 Commons 호출 자체를 생략합니다.
    // (null 이거나 svg fallback("/api/...")인 경우에만 채웁니다.)
    const needsThumb = !c.thumbnailUrl || String(c.thumbnailUrl).startsWith("/api/");
    const needsFull = !c.imageUrl || String(c.imageUrl).startsWith("/api/");
    if (!needsThumb && !needsFull) continue;

    const fileName = commonsFileTitle(c);
    let img;
    try {
      // API 호출 수를 줄이기 위해 thumb 1회만 요청하고, full은 original URL을 사용합니다.
      // eslint-disable-next-line no-await-in-loop
      img = await fetchCommonsImageUrls(fileName, [THUMB_W]);
    } catch (e) {
      imageError += 1;
      console.warn(`[warn] commons api error for ${fileName}: ${String(e?.message ?? e)}`);
      continue;
    }
    if (!img.ok) {
      imageMissing += 1;
      imageMissingFiles.push(fileName);
      continue;
    }
    imageOk += 1;

    const data = {};
    // 기존이 비어있거나(svg fallback)인 경우에만 덮어씁니다.
    if (needsThumb) data.thumbnailUrl = img.urls[THUMB_W];
    if (needsFull) data.imageUrl = img.urls.original;

    if (Object.keys(data).length === 0) continue;

    imageUpdates.push(
      prisma.tarotCard.update({
        where: { id: c.id },
        data
      })
    );

    // Wikimedia API에 부담을 줄이기 위해 소량 딜레이(레이트 리밋/HTML 에러 방지)
    // eslint-disable-next-line no-await-in-loop
    await sleep(80);
  }

  console.log(`[3/4] images ok=${imageOk} missing=${imageMissing} error=${imageError}`);
  if (imageMissingFiles.length > 0) {
    console.log(`[3/4] missing files (first 10): ${imageMissingFiles.slice(0, 10).join(", ")}`);
  }

  console.log("[4/4] writing image URLs to DB...");
  if (imageUpdates.length > 0) {
    // transaction chunking to avoid very large transactions on some setups
    const chunkSize = 25;
    for (let i = 0; i < imageUpdates.length; i += chunkSize) {
      // eslint-disable-next-line no-await-in-loop
      await prisma.$transaction(imageUpdates.slice(i, i + chunkSize));
    }
  }

  const filled = await prisma.tarotCard.count({
    where: {
      AND: [
        { thumbnailUrl: { not: null } },
        { imageUrl: { not: null } },
        { uprightPoints: { not: "데이터 준비 중" } }
      ]
    }
  });

  console.log(
    JSON.stringify(
      { total: cards.length, meaningUpdated: meaningUpdates.length, imageUpdated: imageUpdates.length, filled },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


