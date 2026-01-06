## 카드 이미지 배치 규칙

이 폴더는 **로컬-first** 환경에서 타로 카드 이미지를 정적으로 서빙하기 위한 위치입니다.

### 권장 폴더 구조

- `backend/public/cards/thumb/` : 썸네일(작은 이미지)
- `backend/public/cards/full/` : 상세(큰 이미지)

### 파일명 규칙(슬러그)

DB에 있는 `TarotCard` 데이터로 슬러그를 생성합니다.

- 메이저: `major-{NN}-{nameEnSlug}`
  - 예: `major-00-the-fool.webp`
- 마이너: `minor-{suit}-{rank}`
  - 예: `minor-wands-ace.webp`

지원 확장자: `.webp`, `.png`, `.jpg`, `.jpeg`

### DB URL 동기화

이미지를 배치한 후 아래 스크립트를 실행하면, 존재하는 파일에 한해 DB의 `thumbnailUrl/imageUrl`이 자동으로 업데이트됩니다.

- `npm run cards:sync-images:dev`




