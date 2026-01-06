import type { TarotCardDto } from "@shared/contracts/cards.contract";
import type { ListTarotCardsParams } from "@/repositories/tarot-cards.repository";
import { getTarotCardById, listTarotCards } from "@/repositories/tarot-cards.repository";
import { ServiceError } from "@/lib/service-error";

export async function listCards(params: ListTarotCardsParams): Promise<TarotCardDto[]> {
  const cards = await listTarotCards(params);
  return cards.map(mapTarotCardDto);
}

export async function getCard(id: string): Promise<TarotCardDto> {
  const card = await getTarotCardById(id);
  if (!card) {
    throw new ServiceError({ message: "카드를 찾을 수 없습니다.", detail: { id } });
  }
  return mapTarotCardDto(card);
}

function mapTarotCardDto(card: {
  id: string;
  nameEn: string;
  nameKo: string;
  arcana: "MAJOR" | "MINOR";
  suit: "WANDS" | "CUPS" | "SWORDS" | "PENTACLES" | null;
  rank: string | null;
  sortKey: number;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  keywords: string[];
  description: string;
  uprightPoints: string;
  reversedPoints: string;
}): TarotCardDto {
  return {
    id: card.id,
    nameEn: card.nameEn,
    nameKo: card.nameKo,
    arcana: card.arcana,
    suit: card.suit,
    rank: card.rank,
    sortKey: card.sortKey,
    imageUrl: card.imageUrl,
    thumbnailUrl: card.thumbnailUrl,
    keywords: card.keywords,
    description: card.description,
    uprightPoints: card.uprightPoints,
    reversedPoints: card.reversedPoints
  };
}



