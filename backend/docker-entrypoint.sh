#!/bin/sh
set -eu

echo "[backend] prisma migrate deploy"
./node_modules/.bin/prisma migrate deploy

exec "$@"
