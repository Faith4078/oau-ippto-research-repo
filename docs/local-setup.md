# Local Setup

Use pnpm only.

## Prerequisites

- Node.js compatible with the versions pinned by the lockfile.
- pnpm 11.6.0 or newer.
- PostgreSQL for local development and integration tests.
- Cloudflare R2 credentials for testing direct upload and private download flows.

## Install

```bash
pnpm install
```

## Environment

Copy `.env.example` to `.env.local` and fill local values. Never commit real secrets.

Minimum local values:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/oau_ippto
DATABASE_URL_POOLER=postgresql://postgres:postgres@localhost:5432/oau_ippto
PUBLIC_BASE_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=replace-with-local-secret
```

## Database

Generate and run migrations when schema changes are introduced:

```bash
pnpm db:generate
pnpm db:migrate
```

For early local development, `pnpm db:push` can align a disposable database with the current schema. Do not use `db:push` against production.

## Seed Data

A seed script is not present in this scaffold yet. When Agent 2 adds seed data, expose it as `pnpm db:seed` and keep it limited to demo roles, faculties, departments, users, research records, innovations, and patents.

## Development Server

```bash
pnpm dev
```

The app runs on `http://localhost:3000`.

## Verification

```bash
pnpm check
pnpm test
pnpm test:e2e:install
pnpm test:e2e
pnpm build
```

Run `pnpm build` after meaningful implementation changes.
