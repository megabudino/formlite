# Formlite

A self-hosted Formspree alternative - multi-tenant form backend with email notifications and webhooks.

## Features

- 🔒 User authentication (initial setup, login, logout)
- 🔑 Optional single sign-on with any OpenID Connect provider
- 📝 Create and manage multiple forms
- 📧 Email notifications via Mailgun
- 🔗 Webhook integrations with HMAC signatures
- 🍯 Honeypot spam protection, allowed domains and rate limiting
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
| `SUBMISSION_RATE_LIMIT_PER_IP` | Max submissions per minute to a form from a single IP. `0` disables. | `10` |
| `SUBMISSION_RATE_LIMIT_PER_FORM` | Max submissions per minute to a form overall. `0` disables. | `120` |
| `ADDRESS_HEADER` | Header holding the client IP when running behind a reverse proxy (e.g. `X-Forwarded-For`). See below. | _(none)_ |
| `XFF_DEPTH` | Number of trusted proxies in front of the app, when `ADDRESS_HEADER=X-Forwarded-For`. | `1` |
| `OIDC_ISSUER` | OpenID Connect issuer URL. Enables single sign-on together with `OIDC_CLIENT_ID`. See below. | _(none)_ |
| `OIDC_CLIENT_ID` | Client ID registered with your identity provider. | _(none)_ |
| `OIDC_CLIENT_SECRET` | Client secret. Leave empty for public clients (PKCE only). | _(none)_ |
| `OIDC_PROVIDER_NAME` | Name on the login button ("Continue with …"). | `SSO` |
| `OIDC_TOKEN_AUTH_METHOD` | How the client secret is sent: `client_secret_basic` or `client_secret_post`. Must match the client registration. | `client_secret_basic` |
| `OIDC_ACCOUNT_URL` | Account page at your provider. Users with a linked SSO account get a "Manage … account" link in the user menu. | _(none)_ |
| `PASSWORD_LOGIN` | Set to `false` to allow only single sign-on. Ignored when SSO is not configured. | `true` |

### Rate limiting behind a reverse proxy

Submissions are rate limited per client IP. Behind a reverse proxy (Traefik, Nginx, Dokploy, …) the app only sees the proxy's address unless you set `ADDRESS_HEADER=X-Forwarded-For`; without it, all visitors share the same per-IP limit. Counters are kept in memory, so they are per instance and reset on restart.

### Multi-domain login

If you serve Formlite from more than one hostname (e.g. while migrating from an old domain), set `TRUSTED_ORIGINS` to the full comma-separated list of accepted origins:

```bash
TRUSTED_ORIGINS=https://old-domain.com,https://new-domain.com
```

Each domain has its own session cookie, so users log in independently on each. Wildcards are supported (`https://*.example.com`) for subdomain setups.

### Single sign-on (OpenID Connect)

Formlite can log users in through any OpenID Connect provider (Authentik, Keycloak, Pocket ID, Zitadel, …). Password login keeps working alongside it.

1. Register Formlite as a client in your provider with this redirect URI:
   `<ORIGIN>/api/auth/oauth2/callback/oidc` (for example `https://forms.example.com/api/auth/oauth2/callback/oidc`).
   Formlite uses the authorization code flow with PKCE and asks for the `openid email profile` scopes.
   Also register the post-logout redirect URI `<ORIGIN>/auth/login`.
2. Set `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET` (if your client has one) and optionally `OIDC_PROVIDER_NAME` and `OIDC_ACCOUNT_URL`.
3. Restart. The login page shows a "Continue with …" button.

SSO is invite only: it never creates accounts. A user can log in with SSO only if a Formlite account with the same email already exists, and the provider must report that email as verified (`email_verified`). The first SSO login links the provider identity to that account.

To allow only single sign-on, set `PASSWORD_LOGIN=false`: the password form disappears and the password login endpoint is turned off. Log in once with SSO before turning it on, to check that your account links. If the provider is down, remove the variable and restart to log in with your password again.

Logging out of a session opened with SSO also ends the session at the provider (RP-initiated logout with `id_token_hint`), then returns to the Formlite login page. Sessions opened with a password log out of Formlite only.

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
