import cors from "cors";
import express from "express";
import path from "node:path";
import { getEnv } from "@/config/env";
import { routes } from "@/routes";

export function createApp() {
  const env = getEnv();
  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: "1mb" }));

  // static assets (local-first): backend/public -> /assets/*
  app.use("/assets", express.static(path.join(process.cwd(), "public")));

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api", routes);

  return app;
}



