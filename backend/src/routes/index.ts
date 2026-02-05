import { Router } from "express";
import { cardsRoutes } from "@/routes/cards.routes";
import { drawRoutes } from "@/routes/draw.routes";
import { historyRoutes } from "@/routes/history.routes";

export const routes = Router();

routes.use("/cards", cardsRoutes);
routes.use("/draws", drawRoutes);
routes.use("/history", historyRoutes);





