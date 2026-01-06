import type { TarotCardDto } from "./cards.contract";

export type DrawOrientation = "UPRIGHT" | "REVERSED";

export interface CreateDrawRequest {
  cardCount: 1 | 2 | 3;
}

export interface DrawItemDto {
  id: string;
  position: number;
  orientation: DrawOrientation;
  card: Pick<
    TarotCardDto,
    "id" | "nameEn" | "nameKo" | "arcana" | "suit" | "rank" | "imageUrl" | "thumbnailUrl"
  >;
}

export interface DrawDto {
  id: string;
  date: string; // YYYY-MM-DD
  drawnAt: string; // ISO
  cardCount: number;
  model: string | null;
  promptVersion: number;
  summaryOneLine: string | null;
  readingText: string;
  items: DrawItemDto[];
}

export interface CreateDrawResponse {
  draw: DrawDto;
}





