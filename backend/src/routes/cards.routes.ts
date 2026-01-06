import { Router } from "express";
import {
  listTarotCardsController,
  getTarotCardController,
  getTarotCardImageSvgController,
  getTarotCardThumbnailSvgController
} from "@/controllers/cards.controller";

export const cardsRoutes = Router();

cardsRoutes.get("/", listTarotCardsController);
cardsRoutes.get("/:id/thumbnail.svg", getTarotCardThumbnailSvgController);
cardsRoutes.get("/:id/image.svg", getTarotCardImageSvgController);
cardsRoutes.get("/:id", getTarotCardController);



