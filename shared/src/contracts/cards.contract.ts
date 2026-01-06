export type TarotArcana = "MAJOR" | "MINOR";
export type TarotSuit = "WANDS" | "CUPS" | "SWORDS" | "PENTACLES";

export interface TarotCardDto {
  id: string;
  nameEn: string;
  nameKo: string;
  arcana: TarotArcana;
  suit: TarotSuit | null;
  rank: string | null;
  sortKey: number;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  keywords: string[];
  description: string;
  uprightPoints: string;
  reversedPoints: string;
}

export interface ListTarotCardsRequest {
  query?: string;
  arcana?: TarotArcana;
  suit?: TarotSuit;
}

export interface ListTarotCardsResponse {
  items: TarotCardDto[];
}

export interface GetTarotCardResponse {
  item: TarotCardDto;
}





