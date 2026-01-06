-- CreateEnum
CREATE TYPE "TarotArcana" AS ENUM ('MAJOR', 'MINOR');

-- CreateEnum
CREATE TYPE "TarotSuit" AS ENUM ('WANDS', 'CUPS', 'SWORDS', 'PENTACLES');

-- CreateEnum
CREATE TYPE "DrawOrientation" AS ENUM ('UPRIGHT', 'REVERSED');

-- CreateTable
CREATE TABLE "TarotCard" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameKo" TEXT NOT NULL,
    "arcana" "TarotArcana" NOT NULL,
    "suit" "TarotSuit",
    "rank" TEXT,
    "sortKey" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "thumbnailUrl" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT NOT NULL DEFAULT '데이터 준비 중',
    "uprightPoints" TEXT NOT NULL DEFAULT '데이터 준비 중',
    "reversedPoints" TEXT NOT NULL DEFAULT '데이터 준비 중',

    CONSTRAINT "TarotCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Draw" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "date" TEXT NOT NULL,
    "drawnAt" TIMESTAMP(3) NOT NULL,
    "cardCount" INTEGER NOT NULL,
    "model" TEXT,
    "promptVersion" INTEGER NOT NULL,
    "promptText" TEXT NOT NULL,
    "summaryOneLine" TEXT,
    "readingText" TEXT NOT NULL,

    CONSTRAINT "Draw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrawItem" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "drawId" TEXT NOT NULL,
    "tarotCardId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "orientation" "DrawOrientation" NOT NULL,

    CONSTRAINT "DrawItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TarotCard_arcana_suit_sortKey_idx" ON "TarotCard"("arcana", "suit", "sortKey");

-- CreateIndex
CREATE UNIQUE INDEX "TarotCard_nameEn_key" ON "TarotCard"("nameEn");

-- CreateIndex
CREATE INDEX "Draw_date_idx" ON "Draw"("date");

-- CreateIndex
CREATE INDEX "Draw_drawnAt_idx" ON "Draw"("drawnAt");

-- CreateIndex
CREATE INDEX "DrawItem_tarotCardId_idx" ON "DrawItem"("tarotCardId");

-- CreateIndex
CREATE UNIQUE INDEX "DrawItem_drawId_position_key" ON "DrawItem"("drawId", "position");

-- AddForeignKey
ALTER TABLE "DrawItem" ADD CONSTRAINT "DrawItem_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "Draw"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawItem" ADD CONSTRAINT "DrawItem_tarotCardId_fkey" FOREIGN KEY ("tarotCardId") REFERENCES "TarotCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
