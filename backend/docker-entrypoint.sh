#!/bin/sh
set -eu

echo "[backend] prisma migrate deploy"
./node_modules/.bin/prisma migrate deploy

echo "[backend] seed (if empty)"
node scripts/seed-base-cards.cjs

filled="$(node scripts/check-cards-filled.cjs filled 2>/dev/null || echo 0)"
meaningFilled="$(node scripts/check-cards-filled.cjs meaningFilled 2>/dev/null || echo 0)"
echo "[backend] cards meaningFilled=${meaningFilled}/78 filled(images+meanings)=${filled}/78"

if [ "${filled}" -lt 78 ]; then
  echo "[backend] import RWS + Waite scheduled (background)"
  # 네트워크/소스 오류가 있어도 서버 기동을 막지 않도록 백그라운드 실행
  # 로그는 컨테이너 stdout/stderr로 흘려보냅니다.
  lock="/tmp/import-rws-waite.lock"
  if [ -f "${lock}" ]; then
    echo "[backend] import already running; skip"
  else
    : > "${lock}"
    (
      node scripts/import-rws-waite.cjs
      rm -f "${lock}"
    ) 1>/proc/1/fd/1 2>/proc/1/fd/2 || true &
  fi
fi

exec "$@"
