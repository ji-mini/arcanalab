import { createApp } from "@/app";
import { getEnv } from "@/config/env";
import { prisma } from "@/config/prisma";

async function main() {
  const env = getEnv();
  const app = createApp();

  // Fail-fast: DB 연결 문제를 부팅 시점에 명확히 노출
  await prisma.$connect();

  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[backend] listening on :${env.PORT}`);
  });
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("[backend] failed to start", error);
  process.exit(1);
});


