import type { DrawDto } from "./draw.contract";

export interface GetRecentDrawsResponse {
  items: Array<
    Pick<DrawDto, "id" | "date" | "drawnAt" | "cardCount" | "summaryOneLine" | "items">
  >;
}

export interface GetDrawDetailResponse {
  item: DrawDto;
}

export interface ListDrawsRequest {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  cardCount?: 1 | 2 | 3;
}

export interface ListDrawsResponse {
  items: Array<Pick<DrawDto, "id" | "date" | "drawnAt" | "cardCount" | "summaryOneLine" | "items">>;
}

export interface GetDayDrawsResponse {
  date: string; // YYYY-MM-DD
  items: Array<Pick<DrawDto, "id" | "drawnAt" | "cardCount" | "summaryOneLine" | "items">>;
}

export interface GetCalendarMarksRequest {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
}

export interface CalendarMarkDto {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface GetCalendarMarksResponse {
  items: CalendarMarkDto[];
}



