import { z } from "zod";
import { getEnv } from "@/config/env";

const openAiJsonSchema = z.object({
  // 카드별 해석 + 전체 흐름 + 조언 (자유 형식)
  readingText: z.string().min(1),
  // 40자 내 한 줄 요약
  summaryOneLine: z.string().min(1),
  // 키워드(5~12개 권장)
  keywords: z.array(z.string().min(1)).min(1),
  // 세부 해석 섹션
  moneyReading: z.string().min(1),
  loveReading: z.string().min(1),
  dayReview: z.string().min(1)
});

export interface GenerateReadingInput {
  date: string; // YYYY-MM-DD
  cardCount: number;
  cards: Array<{
    nameKo: string;
    nameEn: string;
    arcana: "MAJOR" | "MINOR";
    suit: string | null;
    orientation: "UPRIGHT" | "REVERSED";
    keywords: string[];
    description: string;
    uprightPoints: string;
    reversedPoints: string;
  }>;
}

export interface GenerateReadingOutput {
  promptText: string;
  model: string;
  readingText: string;
  summaryOneLine: string | null;
}

function formatReading(parsed: {
  readingText: string;
  keywords: string[];
  moneyReading: string;
  loveReading: string;
  dayReview: string;
}): string {
  const keywordsLine = parsed.keywords.map((k) => k.trim()).filter(Boolean).slice(0, 12).join(", ");
  return [
    parsed.readingText.trim(),
    "",
    `키워드: ${keywordsLine || "(none)"}`,
    "",
    "금전적 해석:",
    parsed.moneyReading.trim(),
    "",
    "연애적 해석:",
    parsed.loveReading.trim(),
    "",
    "오늘 하루 총평:",
    parsed.dayReview.trim()
  ].join("\n");
}

function buildPrompt(input: GenerateReadingInput): { promptText: string; messages: Array<{ role: string; content: string }> } {
  const system = [
    "당신은 타로 리딩을 '간결하고 결정적으로' 작성하는 어시스턴트입니다.",
    "반드시 아래에 제공된 카드 데이터(키워드/설명/포인트)만을 근거로 문장을 구성하세요.",
    "카드 데이터가 '데이터 준비 중'인 경우, 추측하지 말고 일반적인 톤의 조언으로만 작성하세요.",
    "출력은 반드시 JSON 하나로만 응답하세요. 추가 텍스트 금지.",
    "과도하게 짧게 쓰지 마세요. 각 섹션을 충분히 서술하되 장황한 수사는 피하세요."
  ].join("\n");

  const cardsBlock = input.cards
    .map((c, idx) => {
      const suitPart = c.suit ? ` / suit=${c.suit}` : "";
      return [
        `#${idx + 1}`,
        `nameKo=${c.nameKo} | nameEn=${c.nameEn}`,
        `arcana=${c.arcana}${suitPart}`,
        `orientation=${c.orientation}`,
        `keywords=${c.keywords.join(", ") || "(none)"}`,
        `description=${c.description}`,
        `uprightPoints=${c.uprightPoints}`,
        `reversedPoints=${c.reversedPoints}`
      ].join("\n");
    })
    .join("\n\n");

  const user = [
    `date=${input.date}`,
    `cardCount=${input.cardCount}`,
    "",
    "cards:",
    cardsBlock,
    "",
    "다음 JSON 형식으로만 답하세요:",
    `{"readingText":"(카드별 해석 + 전체 요약 + 오늘의 조언)","summaryOneLine":"(한 줄 요약, 40자 내)","keywords":["..."],"moneyReading":"...","loveReading":"...","dayReview":"..."}`,
    "",
    "readingText 구성 규칙:",
    "- 카드별 해석: 카드 순서대로 각 4~6문장",
    "- 전체 요약: 3~5문장",
    "- 오늘의 조언: 2~3문장",
    "",
    "추가 필드 규칙:",
    "- keywords: 오늘의 핵심 키워드 5~12개(중복 제거, 짧게)",
    "- moneyReading: 금전/일/성과 관점 3~6문장",
    "- loveReading: 관계/연애 관점 3~6문장",
    "- dayReview: 오늘 하루 총평 3~5문장"
  ].join("\n");

  const promptText = `SYSTEM:\n${system}\n\nUSER:\n${user}`;

  return {
    promptText,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ]
  };
}

export async function generateReadingText(input: GenerateReadingInput): Promise<GenerateReadingOutput> {
  const env = getEnv();
  const model = env.OPENAI_MODEL;
  const apiKey = env.OPENAI_API_KEY;

  const { promptText, messages } = buildPrompt(input);

  if (!apiKey) {
    // OpenAI 미설정 시에도 앱은 동작해야 하므로, 데이터 기반(또는 일반 문구)로 대체합니다.
    const fallbackKeywords = Array.from(
      new Set(
        input.cards
          .flatMap((c) => c.keywords ?? [])
          .map((k) => String(k).trim())
          .filter(Boolean)
      )
    ).slice(0, 10);

    const fallback = [
      "오늘의 리딩(임시):",
      "",
      ...input.cards.map((c, idx) => {
        const dir = c.orientation === "UPRIGHT" ? "정방향" : "역방향";
        return `- ${idx + 1}. ${c.nameKo} (${dir})`;
      }),
      "",
      `키워드: ${fallbackKeywords.length ? fallbackKeywords.join(", ") : "(none)"}`,
      "",
      "금전적 해석:",
      "지출과 결정은 한 박자 쉬어가며, 지금 할 수 있는 작은 정리부터 진행해보세요.",
      "",
      "연애적 해석:",
      "상대의 의도를 추측하기보다, 오늘 필요한 사실과 감정을 차분히 확인해보세요.",
      "",
      "오늘 하루 총평:",
      "크게 밀어붙이기보다 균형을 회복하는 날입니다. 작은 선택을 정리하면 흐름이 정돈됩니다."
    ].join("\n");

    return { promptText, model: "disabled", readingText: fallback, summaryOneLine: "카드 데이터 준비 전 임시 리딩" };
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      top_p: 1,
      messages
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI 호출 실패: ${response.status} ${text}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = json.choices?.[0]?.message?.content ?? "";

  const parsed = openAiJsonSchema.safeParse(safeJsonParse(content));
  if (!parsed.success) {
    return { promptText, model, readingText: content || "리딩 생성에 실패했습니다.", summaryOneLine: null };
  }

  return {
    promptText,
    model,
    readingText: formatReading(parsed.data),
    summaryOneLine: parsed.data.summaryOneLine
  };
}

function safeJsonParse(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}





