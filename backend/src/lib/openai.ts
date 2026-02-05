import { z } from "zod";
import { getEnv } from "@/config/env";

const openAiJsonSchema = z.object({
  readingText: z.string().min(1),
  summaryOneLine: z.string().min(1)
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

function buildPrompt(input: GenerateReadingInput): { promptText: string; messages: Array<{ role: string; content: string }> } {
  const system = [
    "당신은 타로 리딩을 '간결하고 결정적으로' 작성하는 어시스턴트입니다.",
    "반드시 아래에 제공된 카드 데이터(키워드/설명/포인트)만을 근거로 문장을 구성하세요.",
    "카드 데이터가 '데이터 준비 중'인 경우, 추측하지 말고 일반적인 톤의 조언으로만 작성하세요.",
    "출력은 반드시 JSON 하나로만 응답하세요. 추가 텍스트 금지."
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
    `{"readingText":"(카드별 해석 + 전체 요약 + 오늘의 조언)","summaryOneLine":"(한 줄 요약, 40자 내)"}`,
    "",
    "readingText 구성 규칙:",
    "- 카드별 해석: 카드 순서대로 2~4문장",
    "- 전체 요약: 2~3문장",
    "- 오늘의 조언: 1~2문장, 짧게"
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
    const fallback = [
      "오늘의 리딩(임시):",
      "",
      ...input.cards.map((c, idx) => {
        const dir = c.orientation === "UPRIGHT" ? "정방향" : "역방향";
        return `- ${idx + 1}. ${c.nameKo} (${dir})`;
      }),
      "",
      "요약: 카드 데이터가 준비되면 더 정교한 문장으로 확장됩니다.",
      "조언: 오늘은 한 번에 모든 답을 찾기보다, 작은 선택을 정리해보세요."
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
    readingText: parsed.data.readingText,
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





