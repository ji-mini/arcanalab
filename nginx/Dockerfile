FROM node:20-alpine AS frontend_build
WORKDIR /app

# npm ci 캐시를 위해 package 파일만 먼저 복사
COPY frontend/package.json frontend/package-lock.json ./frontend/

WORKDIR /app/frontend
RUN npm ci

# 소스 복사 후 빌드 (shared 포함)
WORKDIR /app
COPY frontend ./frontend
COPY shared ./shared

WORKDIR /app/frontend
RUN npm run build


FROM nginx:1.27-alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend_build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
