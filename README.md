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

### 카드 이미지(실제 파일) 사용

기본값으로는 카드 이미지 URL이 없더라도 UI에서 보여지도록 SVG를 생성/서빙합니다.
실제 카드 이미지 파일을 쓰려면 아래 구조로 배치한 뒤 동기화 스크립트를 실행하세요.

- **이미지 배치 경로**
  - `backend/public/cards/thumb/{slug}.webp`
  - `backend/public/cards/full/{slug}.webp`
- **정적 서빙 URL**
  - `/assets/cards/thumb/{slug}.webp`
  - `/assets/cards/full/{slug}.webp`
- **DB URL 동기화**
  - `cd backend && npm run cards:sync-images:dev`

### 카드 이미지/의미 데이터 자동 채우기 (RWS + Waite)

공개 라이선스 소스에서 **이미지(78장)**와 **카드별 의미(키워드/정방향/역방향)**를 자동으로 채웁니다.

- 이미지: Wikimedia Commons (RWS 카드 파일명 규칙 기반)
- 의미: Project Gutenberg *The Illustrated Key to the Tarot* (A. E. Waite, #43548, plain text)

실행:

- `cd backend && npm run cards:import:rws:dev`


