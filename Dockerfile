# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source files
COPY . .

# Build the SvelteKit application
RUN npm run build

# Prune dev dependencies to keep only production deps
RUN npm prune --production


# Runtime stage
FROM node:20-slim

WORKDIR /app

# Create non-root user for security
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nodejs

# Copy built application and production dependencies from builder
COPY --from=builder --chown=nodejs:nodejs /app/build ./build
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Create data directory for SQLite database
RUN mkdir -p /data && chown nodejs:nodejs /data

# Switch to non-root user
USER nodejs

# Expose the application port
EXPOSE 3000

# Set default environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Run the application
CMD ["node", "build/index.js"]
