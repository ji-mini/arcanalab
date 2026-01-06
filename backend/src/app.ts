import cors from "cors";
import express from "express";
import { getEnv } from "@/config/env";
import { routes } from "@/routes";

export function createApp() {
  const env = getEnv();
  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api", routes);

  return app;
}



