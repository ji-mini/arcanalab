import type { Prisma } from "@prisma/client";
import { prisma } from "@/config/prisma";

export async function createDraw(data: Prisma.DrawCreateInput) {
  return prisma.draw.create({
    data,
    include: {
      items: {
        orderBy: { position: "asc" },
        include: { tarotCard: true }
      }
    }
  });
}

export async function getDrawById(drawId: string) {
  return prisma.draw.findUnique({
    where: { id: drawId },
    include: {
      items: {
        orderBy: { position: "asc" },
        include: { tarotCard: true }
      }
    }
  });
}

export async function listRecentDraws(limit: number) {
  return prisma.draw.findMany({
    orderBy: { drawnAt: "desc" },
    take: limit,
    include: {
      items: {
        orderBy: { position: "asc" },
        include: { tarotCard: true }
      }
    }
  });
}

export async function listDrawsByDateRange(params: { start: string; end: string; cardCount?: number }) {
  const where: Prisma.DrawWhereInput = {
    date: { gte: params.start, lte: params.end },
    ...(params.cardCount ? { cardCount: params.cardCount } : {})
  };

  return prisma.draw.findMany({
    where,
    orderBy: { drawnAt: "desc" },
    include: {
      items: {
        orderBy: { position: "asc" },
        include: { tarotCard: true }
      }
    }
  });
}

export async function listDrawsByDate(date: string) {
  return prisma.draw.findMany({
    where: { date },
    orderBy: { drawnAt: "desc" },
    include: {
      items: {
        orderBy: { position: "asc" },
        include: { tarotCard: true }
      }
    }
  });
}

export async function groupDrawCountByDate(params: { start: string; end: string }) {
  return prisma.draw.groupBy({
    by: ["date"],
    where: { date: { gte: params.start, lte: params.end } },
    _count: { _all: true }
  });
}





