# Freeform

A self-hosted Formspree alternative - multi-tenant form backend with email notifications and webhooks.

## Features

- 🔒 User authentication (signup, login, logout)
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
| `ORIGIN` | Public URL for CORS and cookies | `http://localhost:3000` |
| `NODE_ENV` | Environment mode | `development` |
| `MAILGUN_REGION` | Mailgun API region (`us` or `eu`) | `us` |

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

The easiest way to run Freeform is with Docker Compose:

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

Freeform uses SQLite for data storage. The database file is stored at the path specified by `DATABASE_PATH` (default: `/data/freeform.db`).

### Volume Mount

To persist data across container restarts, mount a volume to the `/data` directory:

```bash
# Docker run
docker run -v /path/to/data:/data freeform

# Or with explicit database path
docker run -v /path/to/data:/data -e DATABASE_PATH=/data/freeform.db freeform
```

The database directory is automatically created if it doesn't exist.
