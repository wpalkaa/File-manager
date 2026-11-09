# ============ DEPS ============
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json .

RUN npm ci --only=production

# ============ PROD ============
FROM node:20-alpine AS prod
WORKDIR /app

RUN apk add --no-cache wget

RUN addgroup -S app && adduser -S app -G app

COPY --from=deps --chown=app:app /app/node_modules /app/node_modules
COPY --chown=app:app . .

USER app
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=10 \
    CMD wget --spider http://localhost:3000/api/health || exit 1

CMD ["node", "src/server.js"]