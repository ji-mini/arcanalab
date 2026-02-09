#!/bin/sh
set -eu

echo "[backend] prisma migrate deploy"
./node_modules/.bin/prisma migrate deploy

echo "[backend] seed (if empty)"
node dist/prisma/seed.js

meaningFilled="$(node scripts/check-cards-filled.cjs meaningFilled 2>/dev/null || echo 0)"
echo "[backend] meanings filled: ${meaningFilled}/78"
if [ "${meaningFilled}" -lt 78 ]; then
  echo "[backend] import RWS + Waite (this may take a while)"
  node scripts/import-rws-waite.cjs
fi

exec "$@"
