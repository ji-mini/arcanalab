import { createApp } from "@/app";
import { getEnv } from "@/config/env";

const env = getEnv();
const app = createApp();

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[backend] listening on :${env.PORT}`);
});


