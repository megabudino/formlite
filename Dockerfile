# Build stage
FROM node:20-slim AS builder

# Build target: "app" (default, adapter-node) or "marketing" (adapter-static)
ARG DEPLOY_TARGET=app
ENV DEPLOY_TARGET=${DEPLOY_TARGET}

# Install build dependencies for native modules (better-sqlite3 only needed for app)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Builds either build:marketing or the default build (app) based on DEPLOY_TARGET
RUN if [ "$DEPLOY_TARGET" = "marketing" ]; then \
		npm run build:marketing; \
	else \
		npm run build; \
	fi

RUN npm prune --production


# --- Marketing runtime: nginx serving prerendered static files ---
FROM nginx:1.27-alpine AS marketing
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


# --- App runtime: node + SQLite ---
FROM node:20-slim AS app

WORKDIR /app

RUN groupadd --gid 1001 nodejs && \
	useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nodejs

COPY --from=builder --chown=nodejs:nodejs /app/build ./build
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

RUN mkdir -p /app/data && chown nodejs:nodejs /app/data

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/freeform.db
ENV DEPLOY_TARGET=app

CMD chown -R nodejs:nodejs /app/data && exec su nodejs -c "node build/index.js"
