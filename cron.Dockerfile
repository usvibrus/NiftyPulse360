FROM node:20-alpine
WORKDIR /app
COPY scripts/cron.mjs ./cron.mjs
CMD ["node", "cron.mjs"]
