FROM node:24-bookworm-slim AS build

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=/api
ARG VITE_GOOGLE_MAPS_API_KEY
ARG SENTRY_UPLOAD_REQUIRED=false
ARG SENTRY_RELEASE

RUN --mount=type=secret,id=SENTRY_AUTH_TOKEN \
    set -eu; \
    if [ -s /run/secrets/SENTRY_AUTH_TOKEN ]; then \
      export SENTRY_AUTH_TOKEN="$(cat /run/secrets/SENTRY_AUTH_TOKEN)"; \
    fi; \
    if [ "$SENTRY_UPLOAD_REQUIRED" = "true" ] && [ -z "${SENTRY_AUTH_TOKEN:-}" ]; then \
      echo "ERROR: Sentry token is required for production builds." >&2; \
      exit 1; \
    fi; \
    VITE_API_BASE_URL="$VITE_API_BASE_URL" \
    VITE_GOOGLE_MAPS_API_KEY="${VITE_GOOGLE_MAPS_API_KEY:-}" \
    npm run build; \
    test -z "$(find dist -type f -name '*.map' -print -quit)"

FROM nginx:stable-alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]