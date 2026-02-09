FROM node:20-bookworm-slim AS backend_deps
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app/backend

# 의존성 캐시를 위해 package 파일만 먼저 복사
COPY backend/package.json backend/package-lock.json ./

# Prisma generate를 위해 스키마 포함
COPY backend/prisma ./prisma

RUN npm ci


FROM node:20-bookworm-slim AS backend_build
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# backend 빌드에 필요한 소스 + shared 포함
COPY backend ./backend
COPY shared ./shared

COPY --from=backend_deps /app/backend/node_modules ./backend/node_modules

WORKDIR /app/backend
RUN ./node_modules/.bin/tsc -p ../shared/tsconfig.build.json
RUN npx prisma generate
RUN npm run build


FROM node:20-bookworm-slim AS backend_runtime
WORKDIR /app/backend

ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY backend/package.json backend/package-lock.json ./
COPY backend/prisma ./prisma
COPY backend/docker-entrypoint.sh ./docker-entrypoint.sh
COPY backend/scripts ./scripts

RUN npm ci --omit=dev
RUN chmod +x ./docker-entrypoint.sh

# ✅ build 단계에서 생성된 prisma client/engine 복사
COPY --from=backend_build /app/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=backend_build /app/backend/node_modules/@prisma ./node_modules/@prisma

COPY --from=backend_build /app/backend/dist ./dist
COPY backend/public ./public

EXPOSE 3001
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
