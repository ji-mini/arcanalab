import { Router } from "express";
import { listTarotCardsController, getTarotCardController } from "@/controllers/cards.controller";

export const cardsRoutes = Router();

cardsRoutes.get("/", listTarotCardsController);
cardsRoutes.get("/:id", getTarotCardController);



