import type { Request, Response } from "express";
import { z } from "zod";
import type { ListTarotCardsResponse, GetTarotCardResponse } from "@shared/contracts/cards.contract";
import { getCard, getCardSvg, listCards } from "@/services/cards.service";
import { ServiceError } from "@/lib/service-error";

const listQuerySchema = z.object({
  query: z.string().optional(),
  arcana: z.enum(["MAJOR", "MINOR"]).optional(),
  suit: z.enum(["WANDS", "CUPS", "SWORDS", "PENTACLES"]).optional()
});

export async function listTarotCardsController(req: Request, res: Response<ListTarotCardsResponse | { message: string; detail?: unknown }>) {
  try {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: "요청 파라미터가 올바르지 않습니다.", detail: parsed.error.flatten() });
    }

    const items = await listCards(parsed.data);
    return res.json({ items });
  } catch (error) {
    return res.status(500).json({ message: "카드 목록 조회에 실패했습니다.", detail: error });
  }
}

export async function getTarotCardController(req: Request, res: Response<GetTarotCardResponse | { message: string; detail?: unknown }>) {
  try {
    const id = req.params.id;
    const item = await getCard(id);
    return res.json({ item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "카드 조회에 실패했습니다.";
    return res.status(404).json({ message, detail: error });
  }
}

export async function getTarotCardThumbnailSvgController(
  req: Request,
  res: Response
): Promise<Response | void> {
  try {
    const id = req.params.id;
    const svg = await getCardSvg(id, "thumb");
    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.status(200).send(svg);
  } catch (error) {
    const status = error instanceof ServiceError ? 404 : 500;
    return res.status(status).json({ message: "카드 썸네일 생성에 실패했습니다.", detail: error });
  }
}

export async function getTarotCardImageSvgController(
  req: Request,
  res: Response
): Promise<Response | void> {
  try {
    const id = req.params.id;
    const svg = await getCardSvg(id, "full");
    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.status(200).send(svg);
  } catch (error) {
    const status = error instanceof ServiceError ? 404 : 500;
    return res.status(status).json({ message: "카드 이미지 생성에 실패했습니다.", detail: error });
  }
}



