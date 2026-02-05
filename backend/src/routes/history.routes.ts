import { Router } from "express";
import {
  getCalendarMarksController,
  getDayDrawsController,
  getDrawDetailController,
  listDrawsController,
  listRecentDrawsController
} from "@/controllers/history.controller";

export const historyRoutes = Router();

historyRoutes.get("/recent", listRecentDrawsController);
historyRoutes.get("/marks", getCalendarMarksController);
historyRoutes.get("/day/:date", getDayDrawsController);
historyRoutes.get("/", listDrawsController);
historyRoutes.get("/:drawId", getDrawDetailController);





