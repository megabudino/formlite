# PRD: Formlite

## Overview

Formlite is a self-hosted form backend, an alternative to Formspree. It allows collecting submissions from HTML forms, sending email notifications, and triggering webhooks—all under your own control.

## Problem Statement

SaaS form services (Formspree, Formcarry, Basin) come with recurring costs, vendor lock-in, and potential data privacy concerns. Developers who want complete control over submission data lack a simple, self-hosted alternative that's easy to deploy.

## Target Users

- **Individual developers**: personal projects where avoiding external dependencies is preferred
- **Freelance developers/agencies**: manage forms for multiple clients and want a centralized solution without per-submission costs
- **Companies and teams**: require self-hosting for compliance, privacy, or internal policies

## Goals

- Provide a complete self-hosted alternative to Formspree
- Support multi-tenancy (multiple users, multiple forms)
- Reliable email notifications via Mailgun
- Webhook integrations with HMAC signatures for security
- Simple deployment via Docker
- Zero per-submission costs

## Key Features

- **User authentication**: signup, login, logout with secure sessions
- **Form management**: create and manage multiple forms per user
- **Email notifications**: automatic sending via Mailgun with US/EU region support
- **Webhooks**: integration with external systems, HMAC signatures for authenticity verification
- **Spam protection**: built-in honeypot field
- **Responsive dashboard**: web interface to manage forms and view submissions
- **SQLite storage**: lightweight database, no external dependencies

## Non-Goals

- Visual form builder (Formlite is backend/API only, users create their own HTML forms)
- Advanced submission analytics
- Multi-provider email support (Mailgun only in v1)
- Native mobile app

## Constraints

- Requires Mailgun for email notifications in production (in dev, emails are logged to console)
- SQLite as the only supported database
- Single-node deployment (no clustering)

## Success Criteria

- Working deployment in under 5 minutes with Docker
- Form submissions processed in real-time
- Emails and webhooks delivered reliably
- Dashboard usable without documentation

## Open Questions

- Support alternative email providers (SendGrid, SES)?
- Add rate limiting for abuse protection?
- Export submissions as CSV/JSON?
- Public API for programmatic integration?
