FROM node:20-alpine AS backend_deps
WORKDIR /app/backend

# 의존성 캐시를 위해 package 파일만 먼저 복사
COPY backend/package.json backend/package-lock.json ./

# Prisma generate를 위해 스키마 포함
COPY backend/prisma ./prisma

RUN npm ci


FROM node:20-alpine AS backend_build
WORKDIR /app

# backend 빌드에 필요한 소스 + shared 포함
COPY backend ./backend
COPY shared ./shared

COPY --from=backend_deps /app/backend/node_modules ./backend/node_modules

WORKDIR /app/backend
RUN ./node_modules/.bin/tsc -p ../shared/tsconfig.build.json
RUN npm run prisma:generate
RUN npm run build


FROM node:20-alpine AS backend_runtime
WORKDIR /app/backend

ENV NODE_ENV=production

COPY backend/package.json backend/package-lock.json ./
COPY backend/prisma ./prisma

# prod 이미지는 devDependencies 제외
RUN npm ci --omit=dev

# 생성된 Prisma Client/엔진 포함
RUN npm run prisma:generate

COPY --from=backend_build /app/backend/dist ./dist
COPY backend/public ./public

EXPOSE 3001
CMD ["node", "dist/index.js"]
