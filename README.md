## ARCANA-LAB (Tarot Research Lab)

단일 사용자(local-first) 타로 연구/기록 웹앱입니다.

### 구조

- `backend/`: Express + TypeScript + Prisma(PostgreSQL)
- `frontend/`: React 18 + Vite + TypeScript + TailwindCSS + TanStack Query
- `shared/`: 프론트/백 공용 Request/Response 계약 타입

### 환경변수

- 백엔드: Windows 호환을 위해 `cross-env + dotenv/config + DOTENV_CONFIG_PATH` 조합으로 로드합니다.
  - `npm run dev` → `.env.development`
  - `npm run start` → `.env.production`
  - env 접근은 항상 `backend/src/config/env.ts`의 `getEnv()`를 사용합니다.
- 프론트: Vite 규칙에 따라 `.env.development` / `.env.production` 을 사용하세요. (`VITE_API_BASE_URL`)


