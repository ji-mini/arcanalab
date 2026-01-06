import { Router } from "express";
import { createDrawController } from "@/controllers/draw.controller";

export const drawRoutes = Router();

drawRoutes.post("/", createDrawController);





