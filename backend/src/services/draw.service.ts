import type { DrawOrientation, Prisma } from "@prisma/client";
import type { CreateDrawRequest, CreateDrawResponse, DrawDto } from "@shared/contracts/draw.contract";
import { getEnv } from "@/config/env";
import { generateReadingText } from "@/lib/openai";
import { ServiceError } from "@/lib/service-error";
import { createDraw } from "@/repositories/draws.repository";
import { getTarotCardById, listAllTarotCardIds } from "@/repositories/tarot-cards.repository";

const MIN_CARD_COUNT = 1;
const MAX_CARD_COUNT = 3;

export async function createTodayDraw(req: CreateDrawRequest): Promise<CreateDrawResponse> {
  const cardCount = req.cardCount;
  if (cardCount < MIN_CARD_COUNT || cardCount > MAX_CARD_COUNT) {
    throw new ServiceError({ message: "cardCount는 1~3만 가능합니다.", detail: { cardCount } });
  }

  const now = new Date();
  const date = now.toISOString().slice(0, 10);

  const ids = await listAllTarotCardIds();
  if (ids.length < cardCount) {
    throw new ServiceError({ message: "카드 마스터 데이터가 부족합니다.", detail: { available: ids.length } });
  }

  const selectedIds = pickRandomUnique(ids.map((x) => x.id), cardCount);
  const selectedCards = await Promise.all(selectedIds.map((id) => getTarotCardById(id)));
  if (selectedCards.some((c) => !c)) {
    throw new ServiceError({ message: "선택된 카드 데이터를 찾지 못했습니다." });
  }

  const itemsInput = selectedCards.map((card, idx) => {
    const orientation: DrawOrientation = Math.random() < 0.5 ? "UPRIGHT" : "REVERSED";
    return { card: card!, position: idx + 1, orientation };
  });

  const env = getEnv();
  const promptVersion = env.PROMPT_VERSION;

  const ai = await generateReadingText({
    date,
    cardCount,
    cards: itemsInput.map((it) => ({
      nameKo: it.card.nameKo,
      nameEn: it.card.nameEn,
      arcana: it.card.arcana,
      suit: it.card.suit,
      orientation: it.orientation,
      keywords: it.card.keywords,
      description: it.card.description,
      uprightPoints: it.card.uprightPoints,
      reversedPoints: it.card.reversedPoints
    }))
  });

  const created = await createDraw({
    date,
    drawnAt: now,
    cardCount,
    model: ai.model === "disabled" ? null : ai.model,
    promptVersion,
    promptText: ai.promptText,
    summaryOneLine: ai.summaryOneLine,
    readingText: ai.readingText,
    items: {
      create: itemsInput.map((it) => ({
        position: it.position,
        orientation: it.orientation,
        tarotCard: { connect: { id: it.card.id } }
      }))
    }
  });

  return { draw: mapDrawDto(created) };
}

function pickRandomUnique<T>(items: T[], count: number): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

export function mapDrawDto(draw: {
  id: string;
  date: string;
  drawnAt: Date;
  cardCount: number;
  model: string | null;
  promptVersion: number;
  summaryOneLine: string | null;
  readingText: string;
  items: Array<{
    id: string;
    position: number;
    orientation: "UPRIGHT" | "REVERSED";
    tarotCard: {
      id: string;
      nameEn: string;
      nameKo: string;
      arcana: "MAJOR" | "MINOR";
      suit: "WANDS" | "CUPS" | "SWORDS" | "PENTACLES" | null;
      rank: string | null;
      imageUrl: string | null;
      thumbnailUrl: string | null;
    };
  }>;
}): DrawDto {
  return {
    id: draw.id,
    date: draw.date,
    drawnAt: draw.drawnAt.toISOString(),
    cardCount: draw.cardCount,
    model: draw.model,
    promptVersion: draw.promptVersion,
    summaryOneLine: draw.summaryOneLine,
    readingText: draw.readingText,
    items: draw.items.map((it) => ({
      id: it.id,
      position: it.position,
      orientation: it.orientation,
      card: {
        id: it.tarotCard.id,
        nameEn: it.tarotCard.nameEn,
        nameKo: it.tarotCard.nameKo,
        arcana: it.tarotCard.arcana,
        suit: it.tarotCard.suit,
        rank: it.tarotCard.rank,
        imageUrl: it.tarotCard.imageUrl,
        thumbnailUrl: it.tarotCard.thumbnailUrl
      }
    }))
  };
}


