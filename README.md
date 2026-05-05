# SplitEase — Deployment & CI Checklist

This file contains quick steps to prepare, build, and deploy SplitEase to production.

## Environment
- Copy `.env.example` to `.env` and set:
  - `MONGO_URI` (MongoDB connection string)
  - `JWT_SECRET` (strong random secret)
  - `CLIENT_URL` (frontend origin)
  - Optional SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`

## Production hardening applied
- Helmet enabled for security headers
- Basic rate limiting configured
- Morgan logging in non-production
- Request size limit increased to 10mb

## Running locally
```bash
npm install
cp .env.example .env # then edit .env
npm start
```

## Docker
Build and run:
```bash
docker build -t splitease:latest .
docker run -p 5000:5000 --env-file .env splitease:latest
```

## Process manager (PM2)
```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

## CI/CD (GitHub Actions) — example
Create `.github/workflows/ci.yml` with a pipeline to install, test, build and deploy. Example steps:
- Checkout repo
- Install Node
- Install dependencies `npm ci`
- Run lint/tests
- Build frontend (if separate)
- Deploy to target (container registry / server)

## Recommended next improvements
- Add unit and integration tests (Jest + Supertest for backend, RTL for frontend)
- Add E2E tests (Cypress)
- Add email templates and queue for sending invites
- Add feature flags for invite options (single-use vs multi-use)
- Add observability (Sentry) and structured logging (winston)

## Troubleshooting
- If server fails to start, check logs and ensure `MONGO_URI` is correct.
- To clear stale invites, use MongoDB shell or admin UI to update `invites` collection.

