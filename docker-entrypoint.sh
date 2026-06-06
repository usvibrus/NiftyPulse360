#!/bin/sh
set -e

echo "[entrypoint] Starting Next.js server..."
exec node --max-old-space-size=512 --max-semi-space-size=8 server.js
