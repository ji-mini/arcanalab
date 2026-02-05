# 기술 스택 정리

## 개요

ARCANA-LAB은 **단일 사용자(Local-first)** 타로 연구/기록 웹앱입니다.

## Frontend

- React 18
- Vite
- TypeScript(Strict)
- TailwindCSS
- TanStack Query

## Backend

- Node.js
- Express
- TypeScript
- REST API
  - Controller / Service / Repository 레이어 분리

## Database / ORM

- PostgreSQL
- Prisma ORM

## Shared(Contract)

- `shared/` 패키지에 Request/Response 계약 타입을 정의하여 프론트/백이 동일한 타입을 공유합니다.

## AI(OpenAI) 사용 원칙

- OpenAI 호출은 **백엔드에서만** 수행합니다.
- 프론트는 OpenAI를 직접 호출하지 않습니다.
- **프롬프트와 생성 결과**는 DB에 저장되어야 하며, 기록에서 재열람 가능해야 합니다.
- GPT 응답은 가능한 한 **결정적이고 간결**해야 합니다.
- 타로 의미는 “모델의 상상”이 아니라 **사전 정의 카드 데이터**를 기반으로만 설명합니다.

## 로컬 퍼스트(Local-first) 이미지 전략

- 기본값: 카드 이미지 URL이 없더라도 UI가 깨지지 않도록 **SVG 생성/서빙**으로 폴백합니다.
- 선택값: 실제 카드 이미지를 `backend/public/cards/` 아래에 두고, DB의 `thumbnailUrl/imageUrl`을 동기화하여 사용합니다.

## 실행/환경변수(Windows 호환)

- 백엔드: `dotenv/config`로 단일 `.env`를 로드합니다.
- 프론트: Vite 규칙에 따라 `.env`를 로드합니다. (예: `VITE_API_BASE_URL=/api`)


