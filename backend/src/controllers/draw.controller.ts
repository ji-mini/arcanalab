import type { Request, Response } from "express";
import { z } from "zod";
import type { CreateDrawRequest, CreateDrawResponse } from "@shared/contracts/draw.contract";
import { createTodayDraw } from "@/services/draw.service";
import { ServiceError } from "@/lib/service-error";

const bodySchema = z.object({
  cardCount: z.union([z.literal(1), z.literal(2), z.literal(3)])
});

export async function createDrawController(req: Request, res: Response<CreateDrawResponse | { message: string; detail?: unknown }>) {
  try {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "요청 바디가 올바르지 않습니다.", detail: parsed.error.flatten() });
    }

    const result = await createTodayDraw(parsed.data as CreateDrawRequest);
    return res.status(201).json(result);
  } catch (error) {
    const status = error instanceof ServiceError ? 400 : 500;
    const message = error instanceof Error ? error.message : "뽑기 생성에 실패했습니다.";
    return res.status(status).json({ message, detail: error });
  }
}





