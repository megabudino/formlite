# Formlite

A self-hosted Formspree alternative - multi-tenant form backend with email notifications and webhooks.

## Features

- 🔒 User authentication (initial setup, login, logout)
- 📝 Create and manage multiple forms
- 📧 Email notifications via Mailgun
- 🔗 Webhook integrations with HMAC signatures
- 🍯 Honeypot spam protection
- 📱 Responsive dashboard

## Environment Variables

### Required (for email notifications)

| Variable | Description | Example |
|----------|-------------|---------|
| `MAILGUN_API_KEY` | Your Mailgun API key | `key-xxxxxxxxxxxxxxxx` |
| `MAILGUN_DOMAIN` | Your Mailgun sending domain | `mg.yourdomain.com` |
| `MAILGUN_FROM_EMAIL` | The "from" email address | `noreply@yourdomain.com` |

> **Note:** In development mode (`NODE_ENV !== 'production'`), email notifications are logged to the console if Mailgun is not configured.

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_PATH` | Path to SQLite database file | `/data/freeform.db` |
| `PORT` | Server port | `3000` |
| `ORIGIN` | Canonical public URL (used by SvelteKit). Always trusted for login. | `http://localhost:3000` |
| `TRUSTED_ORIGINS` | Additional origins allowed to log in (comma-separated). Supports wildcards like `https://*.example.com`. | _(none)_ |
| `NODE_ENV` | Environment mode | `development` |
| `MAILGUN_REGION` | Mailgun API region (`us` or `eu`) | `us` |

### Multi-domain login

If you serve Formlite from more than one hostname (e.g. while migrating from an old domain), set `TRUSTED_ORIGINS` to the full comma-separated list of accepted origins:

```bash
TRUSTED_ORIGINS=https://old-domain.com,https://new-domain.com
```

Each domain has its own session cookie, so users log in independently on each. Wildcards are supported (`https://*.example.com`) for subdomain setups.

## Development

1. Install dependencies:

```bash
npm install
```

2. Initialize the database:

```bash
npm run db:init
```

3. Start the development server:

```bash
npm run dev
```

4. On first visit with a fresh database, you'll be redirected to `/setup` to create the initial admin account. After setup, use `/auth/login` for access.

## Building

Create a production build:

```bash
npm run build
```

The build outputs to `build/` with `build/index.js` as the entry point.

## Running in Production

```bash
NODE_ENV=production \
ORIGIN=https://yourdomain.com \
MAILGUN_API_KEY=your-api-key \
MAILGUN_DOMAIN=mg.yourdomain.com \
MAILGUN_FROM_EMAIL=noreply@yourdomain.com \
DATABASE_PATH=/data/freeform.db \
node build/index.js
```

## Docker Deployment

### Building the Image

```bash
docker build -t freeform .
```

### Running with Docker

```bash
docker run -d \
  --name freeform \
  -p 3000:3000 \
  -v /path/to/data:/data \
  -e NODE_ENV=production \
  -e ORIGIN=https://yourdomain.com \
  -e MAILGUN_API_KEY=your-api-key \
  -e MAILGUN_DOMAIN=mg.yourdomain.com \
  -e MAILGUN_FROM_EMAIL=noreply@yourdomain.com \
  freeform
```

### Using Docker Compose

The easiest way to run Formlite is with Docker Compose:

```bash
# Edit docker-compose.yml to set your environment variables
# Then start the service:
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

Example `docker-compose.yml` configuration:

```yaml
services:
  freeform:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - freeform-data:/data
    environment:
      - NODE_ENV=production
      - ORIGIN=https://yourdomain.com
      - MAILGUN_API_KEY=your-api-key
      - MAILGUN_DOMAIN=mg.yourdomain.com
      - MAILGUN_FROM_EMAIL=noreply@yourdomain.com
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  freeform-data:
```

## Data Persistence

Formlite uses SQLite for data storage. The database file is stored at the path specified by `DATABASE_PATH` (default: `/data/freeform.db`).

### Volume Mount

To persist data across container restarts, mount a volume to the `/data` directory:

```bash
# Docker run
docker run -v /path/to/data:/data freeform

# Or with explicit database path
docker run -v /path/to/data:/data -e DATABASE_PATH=/data/freeform.db freeform
```

The database directory is automatically created if it doesn't exist.

## Marketing Site

The marketing site (`src/routes-marketing/`) is a separate, fully prerendered static build. It has no database, no env vars, and shares the same repository as the app via the `DEPLOY_TARGET` switch in `svelte.config.js`.

### Local build

```bash
npm run build:marketing   # outputs static files to build/
npm run preview:marketing # preview locally
```

### Docker

The `Dockerfile` is multi-stage with two final targets:

| Target | Runtime | Port | What it serves |
|--------|---------|------|----------------|
| `app` (default) | node + SQLite | 3000 | The full app |
| `marketing` | nginx | 80 | Prerendered marketing site |

Build the marketing image directly:

```bash
docker build --target marketing -t formlite-marketing .
docker run -p 80:80 formlite-marketing
```

Or use the dedicated compose file:

```bash
PUBLIC_APP_URL=https://app.your-domain.com docker compose -f docker-compose.marketing.yml up -d
```

### Marketing CTAs → App

The marketing page's CTAs ("Log in", "Get started", …) need to point at the running app. Set the **build-time** env var `PUBLIC_APP_URL` to the app's public URL (e.g. `https://app.your-domain.com`). If unset, the CTAs render as relative paths (only useful when marketing and app share a host).

In Dokploy this is just a build arg / environment variable on the marketing application.

### Deploying to Dokploy (or any compose-based PaaS)

Create a **second application** in Dokploy pointed at the same git repo, and set:

| Dokploy field | Value |
|---------------|-------|
| Application type | **Docker Compose** |
| Compose file path | `docker-compose.marketing.yml` |
| Environment variables | `PUBLIC_APP_URL=https://app.your-domain.com` |
| Domain | e.g. `www.your-domain.com` |

That's the only switch needed. The first application keeps using the default `docker-compose.yml` for the app.

If you prefer the **Dockerfile** application type instead of Compose, set:

| Dokploy field | Value |
|---------------|-------|
| Dockerfile path | `./Dockerfile` |
| Build stage / target | `marketing` |
| Build args | `PUBLIC_APP_URL=https://app.your-domain.com` |
| Internal port | `80` |

No runtime env vars are required (the site is static).
