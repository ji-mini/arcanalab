import type { Request, Response } from "express";
import { z } from "zod";
import type {
  GetCalendarMarksResponse,
  GetDayDrawsResponse,
  GetDrawDetailResponse,
  GetRecentDrawsResponse,
  ListDrawsResponse
} from "@shared/contracts/history.contract";
import { ServiceError } from "@/lib/service-error";
import { getCalendarMarks, getDayDraws, getDrawDetail, getRecent, listDraws } from "@/services/history.service";

function serializeError(error: unknown): unknown {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return error;
}

const recentQuerySchema = z.object({
  limit: z.coerce.number().int().positive().optional()
});

const marksQuerySchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

const listQuerySchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cardCount: z.coerce.number().int().optional()
});

export async function listRecentDrawsController(
  req: Request,
  res: Response<GetRecentDrawsResponse | { message: string; detail?: unknown }>
) {
  try {
    const parsed = recentQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: "요청 파라미터가 올바르지 않습니다.", detail: parsed.error.flatten() });
    }
    const result = await getRecent(parsed.data.limit);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: "최근 기록 조회에 실패했습니다.", detail: serializeError(error) });
  }
}

export async function getCalendarMarksController(
  req: Request,
  res: Response<GetCalendarMarksResponse | { message: string; detail?: unknown }>
) {
  try {
    const parsed = marksQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: "요청 파라미터가 올바르지 않습니다.", detail: parsed.error.flatten() });
    }
    const result = await getCalendarMarks(parsed.data);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: "달력 마킹 조회에 실패했습니다.", detail: serializeError(error) });
  }
}

export async function getDayDrawsController(
  req: Request,
  res: Response<GetDayDrawsResponse | { message: string; detail?: unknown }>
) {
  try {
    const date = req.params.date;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: "date는 YYYY-MM-DD 형식이어야 합니다." });
    }
    const result = await getDayDraws(date);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: "일자 기록 조회에 실패했습니다.", detail: serializeError(error) });
  }
}

export async function listDrawsController(
  req: Request,
  res: Response<ListDrawsResponse | { message: string; detail?: unknown }>
) {
  try {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: "요청 파라미터가 올바르지 않습니다.", detail: parsed.error.flatten() });
    }

    const cardCount =
      parsed.data.cardCount === 1 || parsed.data.cardCount === 2 || parsed.data.cardCount === 3
        ? parsed.data.cardCount
        : undefined;

    const result = await listDraws({ start: parsed.data.start, end: parsed.data.end, cardCount });
    return res.json(result);
  } catch (error) {
    const status = error instanceof ServiceError ? 400 : 500;
    return res.status(status).json({ message: "기록 목록 조회에 실패했습니다.", detail: serializeError(error) });
  }
}

export async function getDrawDetailController(
  req: Request,
  res: Response<GetDrawDetailResponse | { message: string; detail?: unknown }>
) {
  try {
    const drawId = req.params.drawId;
    const result = await getDrawDetail(drawId);
    return res.json(result);
  } catch (error) {
    const status = error instanceof ServiceError ? 404 : 500;
    const message = error instanceof Error ? error.message : "기록 조회에 실패했습니다.";
    return res.status(status).json({ message, detail: serializeError(error) });
  }
}





