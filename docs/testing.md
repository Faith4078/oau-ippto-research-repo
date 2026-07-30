# Testing Scaffold

This project uses Vitest for unit and integration tests, and Playwright for browser regression tests. Use pnpm for every command.

## Commands

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
pnpm test:e2e:install
pnpm test:e2e
```

## Test Layout

- `tests/unit`: fast tests for domain rules, application helpers, validation, permissions, state transitions, and storage URL helpers.
- `tests/integration`: service integration tests using deterministic test doubles where an external PostgreSQL or Cloudflare R2 service is not required.
- `tests/e2e`: Playwright flows for homepage discovery, search, sign in, lecturer submissions, review workflows, and admin management.
- `tests/setup`: shared Vitest setup.

## Required Coverage Areas

Agent 10 requires these suites before production readiness:

- Domain rules and state transitions.
- Zod validation schemas for all user input.
- Server-side permissions and authorization regressions.
- File validation for MIME type, extension, size limit, access level, and checksum where available.
- Repository and service integration tests against PostgreSQL.
- Cloudflare R2 signed upload and signed download URL generation.
- Metadata persistence after direct browser uploads.
- Public browsing and staff workflow Playwright coverage.

## Current Local Coverage

The checked-in Vitest suite covers domain workflow transitions, application authorization, Staff ID auth helpers, signup validation, search/report services, R2 signed URL generation, and research workflow service integration with in-memory repository/storage/audit doubles.

The checked-in Playwright suite covers homepage discovery, public research/researcher/report browsing, public detail navigation, staff sign-in form rendering, lecturer signup form rendering, IPTTO signup form rendering, and anonymous dashboard redirect behavior. `pnpm exec playwright test --list` should list 20 browser tests across desktop and mobile projects.

## Local Integration Test Database

Use a separate PostgreSQL database for integration tests. Do not point tests at production or shared staging databases.

Required local variables:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/oau_ippto_test
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/oau_ippto_test
```

Run migrations before repository integration tests that use PostgreSQL directly:

```bash
pnpm db:migrate
pnpm test
```

## Playwright Notes

The Playwright config starts `pnpm dev` on `http://127.0.0.1:3000`. Run `pnpm test:e2e:install` once on a new machine to install Chromium.

As role workflows are implemented, add dedicated tests for:

- Staff ID and password sign in.
- Lecturer research submission.
- Department and faculty review decisions.
- IPTTO innovation and patent review.
- Super administrator role and permission changes.
- Unauthorized direct navigation and direct action calls.
