import type { Prisma, TarotArcana, TarotSuit } from "@prisma/client";
import { prisma } from "@/config/prisma";

export interface ListTarotCardsParams {
  query?: string;
  arcana?: TarotArcana;
  suit?: TarotSuit;
}

export async function listTarotCards(params: ListTarotCardsParams) {
  const where: Prisma.TarotCardWhereInput = {
    ...(params.arcana ? { arcana: params.arcana } : {}),
    ...(params.suit ? { suit: params.suit } : {}),
    ...(params.query
      ? {
          OR: [
            { nameKo: { contains: params.query, mode: "insensitive" } },
            { nameEn: { contains: params.query, mode: "insensitive" } }
          ]
        }
      : {})
  };

  return prisma.tarotCard.findMany({
    where,
    orderBy: [{ sortKey: "asc" }, { nameEn: "asc" }]
  });
}

export async function getTarotCardById(id: string) {
  return prisma.tarotCard.findUnique({ where: { id } });
}

export async function listAllTarotCardIds() {
  return prisma.tarotCard.findMany({ select: { id: true } });
}


