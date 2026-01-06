# 테스트 시나리오

> 목표: 단일 사용자(local-first) 환경에서 카드/드로우/히스토리 및 자동 채움 스크립트가 **일관되게 동작**하는지 확인합니다.

## 0. 공통 전제

- DB에 `TarotCard` 78장이 존재합니다.
- 네트워크가 가능한 환경(자동 채움/Commons 이미지 URL 확인 시 필요)
- 모든 화면은 비동기 처리에 대해 **로딩/빈 상태/에러 상태**가 있어야 합니다.

## A. Cards(카드) 화면

### A1. 카드 목록 기본 조회

- **Given** DB에 78장 존재
- **When** 카드 목록 페이지 진입
- **Then**
  - 목록이 로딩 후 표시된다
  - 기본 정렬이 `sortKey` 기준으로 일관된다
  - 에러 없이 렌더링된다

### A2. 카드 검색(한글/영문)

- **When** 검색어에 `바보` 입력
- **Then** `The Fool`(바보) 카드가 결과에 포함된다

- **When** 검색어에 `Fool` 입력
- **Then** 동일 카드가 결과에 포함된다

### A3. 필터(Arcana/Suit)

- **When** arcana=`MAJOR`
- **Then** 메이저 카드만 보인다(22장)

- **When** arcana=`MINOR`, suit=`CUPS`
- **Then** 컵 카드만 보인다(14장)

### A4. 카드 상세 정보 표시

- **When** 아무 카드 상세 진입
- **Then**
  - 이미지(thumb 또는 full)가 표시된다
  - 키워드/정방향/역방향 텍스트가 비어있지 않다

### A5. 이미지 폴백(SVG)

- **Given** 특정 카드의 `thumbnailUrl/imageUrl`이 비어있다(null)
- **When** 목록/상세에서 해당 카드가 렌더링된다
- **Then** SVG 폴백이 표시되어 UI가 깨지지 않는다

## B. Draw(드로우) + GPT 저장

### B1. 드로우 생성 및 저장

- **When** 카드 N장 드로우 실행
- **Then**
  - Draw 레코드가 생성된다
  - DrawItem이 N개 생성된다
  - 각 DrawItem에 position(0..N-1)과 orientation(upright/reversed)이 있다

### B2. GPT 리딩 생성(백엔드만)

- **When** 드로우 결과로 리딩 생성 요청
- **Then**
  - 백엔드에서 OpenAI 호출이 수행된다
  - Draw에 `promptText`와 생성 결과(예: `readingText`)가 저장된다
  - 프론트는 OpenAI 키/엔드포인트를 직접 호출하지 않는다

### B3. 에러 처리(실패 시 데이터 보존)

- **When** GPT 호출 실패(키 없음/네트워크 오류 등)
- **Then**
  - 사용자에게 에러 상태가 표시된다(차분한 문구)
  - 기존 드로우 데이터는 손상되지 않는다

## C. History(기록) 재열람

### C1. 기록 목록/상세 조회

- **Given** Draw 기록이 1개 이상 존재
- **When** 히스토리 목록 진입 후 상세 진입
- **Then**
  - 저장된 카드 목록/정역/순서가 그대로 표시된다
  - 저장된 GPT 결과가 그대로 표시된다(재생성 아님)

### C2. 날짜 포맷 규칙

- **Then** Draw.date는 항상 `YYYY-MM-DD` 포맷이다

## D. RWS + Waite 자동 채움 스크립트

### D1. 자동 채움 실행

- **When** `cd backend && npm run cards:import:rws:dev`
- **Then**
  - 에러 없이 종료된다
  - `TarotCard` 78장 모두에 의미(`uprightPoints`)가 채워진다
  - `thumbnailUrl/imageUrl`이 채워진다(Commons 기반 URL)

### D2. 재실행 안전성

- **Given** 이미 채워진 상태
- **When** 스크립트를 다시 실행
- **Then** 데이터가 누적/파손되지 않고 일관된 상태를 유지한다

### D3. 부분 실패 후 복구(네트워크)

- **When** 실행 중 네트워크가 끊겨 실패
- **Then**
  - 스크립트는 실패로 종료할 수 있다
  - 네트워크 복구 후 재실행하면 정상 상태로 수렴한다

## E. 로컬 이미지 파일 동기화(선택 기능)

### E1. 파일 배치 및 URL 동기화

- **Given** 이미지 파일이 아래 경로/슬러그 규칙에 맞게 배치되어 있다
  - `backend/public/cards/thumb/{slug}.webp`
  - `backend/public/cards/full/{slug}.webp`
- **When** `cd backend && npm run cards:sync-images:dev`
- **Then** 해당 파일이 있는 카드에 한해 DB의 `thumbnailUrl/imageUrl`이 로컬 정적 URL로 업데이트된다


