import type {
  GetCalendarMarksRequest,
  GetCalendarMarksResponse,
  GetDayDrawsResponse,
  GetDrawDetailResponse,
  GetRecentDrawsResponse,
  ListDrawsRequest,
  ListDrawsResponse
} from "@shared/contracts/history.contract";
import { ServiceError } from "@/lib/service-error";
import {
  getDrawById,
  groupDrawCountByDate,
  listDrawsByDate,
  listDrawsByDateRange,
  listRecentDraws
} from "@/repositories/draws.repository";
import { mapDrawDto } from "@/services/draw.service";

const DEFAULT_RECENT_LIMIT = 3;
const MAX_RECENT_LIMIT = 20;

export async function getRecent(limit?: number): Promise<GetRecentDrawsResponse> {
  const safeLimit = Math.min(Math.max(limit ?? DEFAULT_RECENT_LIMIT, 1), MAX_RECENT_LIMIT);
  const draws = await listRecentDraws(safeLimit);
  return { items: draws.map(mapDrawDto) };
}

export async function getCalendarMarks(req: GetCalendarMarksRequest): Promise<GetCalendarMarksResponse> {
  const grouped = await groupDrawCountByDate(req);
  return { items: grouped.map((g) => ({ date: g.date, count: g._count._all })) };
}

export async function getDayDraws(date: string): Promise<GetDayDrawsResponse> {
  const draws = await listDrawsByDate(date);
  return { date, items: draws.map(mapDrawDto) };
}

export async function listDraws(req: ListDrawsRequest): Promise<ListDrawsResponse> {
  const draws = await listDrawsByDateRange({
    start: req.start,
    end: req.end,
    cardCount: req.cardCount
  });
  return { items: draws.map(mapDrawDto) };
}

export async function getDrawDetail(drawId: string): Promise<GetDrawDetailResponse> {
  const draw = await getDrawById(drawId);
  if (!draw) {
    throw new ServiceError({ message: "기록을 찾을 수 없습니다.", detail: { drawId } });
  }
  return { item: mapDrawDto(draw) };
}





