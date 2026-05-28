# --- Shared base: install deps and copy source ---
FROM node:20-slim AS base

# python3/make/g++ are needed by better-sqlite3 native build (required by package.json)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .


# --- Builder for the app (adapter-node, SSR + SQLite) ---
FROM base AS builder-app
ENV DEPLOY_TARGET=app
RUN npm run build
RUN npm prune --production


# --- Builder for marketing (adapter-static, prerendered HTML) ---
FROM base AS builder-marketing
# Base URL of the app site to which marketing CTAs link (e.g. https://app.example.com).
# Empty by default → relative paths (only useful when marketing and app share a host).
ARG PUBLIC_APP_URL=""
ENV PUBLIC_APP_URL=${PUBLIC_APP_URL}
ENV DEPLOY_TARGET=marketing
RUN npm run build:marketing


# --- Marketing runtime: nginx serving prerendered static files ---
FROM nginx:1.27-alpine AS marketing
COPY --from=builder-marketing /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


# --- App runtime: node + SQLite. Kept as the LAST stage so `docker build .`
#     without --target keeps producing the app image (backward compatible). ---
FROM node:20-slim AS app

WORKDIR /app

RUN groupadd --gid 1001 nodejs && \
	useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nodejs

COPY --from=builder-app --chown=nodejs:nodejs /app/build ./build
COPY --from=builder-app --chown=nodejs:nodejs /app/package.json ./
COPY --from=builder-app --chown=nodejs:nodejs /app/node_modules ./node_modules

RUN mkdir -p /app/data && chown nodejs:nodejs /app/data

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/freeform.db
ENV DEPLOY_TARGET=app

CMD chown -R nodejs:nodejs /app/data && exec su nodejs -c "node build/index.js"
