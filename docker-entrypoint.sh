#!/bin/sh
set -e

echo "[entrypoint] Running Prisma migrations..."
node node_modules/prisma/build/index.js migrate deploy || {
  echo "[entrypoint] WARNING: prisma migrate deploy failed. Trying db push..."
  node node_modules/prisma/build/index.js db push --accept-data-loss --skip-generate || {
    echo "[entrypoint] WARNING: prisma db push also failed. Starting server anyway."
  }
}

echo "[entrypoint] Starting Next.js server..."
exec node --max-old-space-size=320 --max-semi-space-size=8 server.js
