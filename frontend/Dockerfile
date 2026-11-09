# ============ DEPENDENCIES ============
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json .

RUN npm ci

# ============ BUILD ============
FROM node:20-alpine AS build
WORKDIR /app

ARG NEXT_PUBLIC_SERVER_URL
ARG NEXT_PUBLIC_MQTT_BROKER_URL

ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL
ENV NEXT_PUBLIC_MQTT_BROKER_URL=$NEXT_PUBLIC_MQTT_BROKER_URL

COPY --from=deps /app/node_modules ./node_modules

COPY . .

RUN npm run build

# ============ PRODUCTION ============
FROM node:20-alpine AS prod
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app

COPY --from=build --chown=app:app /app/.next/ /app/.next
COPY --from=build --chown=app:app /app/node_modules /app/node_modules
COPY --from=build --chown=app:app /app/public /app/public
COPY --from=build --chown=app:app /app/package*.json /app
# COPY --from=build --chown=app:app /app/certificates /app/certificates

RUN apk add --no-cache wget
RUN apk add --no-cache su-exec

# USER app

HEALTHCHECK --interval=10s --timeout=10s --start-period=10s --retries=5 \
    CMD wget -qO- http://localhost:3000/ || exit 1

CMD sh -c 'export SECRET_KEY=$(cat "${SECRET_KEY_FILE}") && exec su-exec app npm run start'
