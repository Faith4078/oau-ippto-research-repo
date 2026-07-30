# OAU IPTTO Research Repository

The OAU IPTTO Research Repository is a web application for public research discovery, lecturer submissions, institutional review workflows, innovation visibility, patent tracking, and IPTTO operations.

The app is built for Obafemi Awolowo University staff and public visitors. Lecturers can create accounts, submit research, upload files to Cloudflare R2, and track publication status. IPTTO users can review live operational data for innovations, patents, commercialization activity, and IPTTO reviews. Public users can browse published research and related institutional information.

Use `pnpm` for all project commands.

## Features

- Public research catalogue and discovery pages.
- Research detail, researcher, faculty, department, publication, innovation, patent, report, FAQ, news, and contact pages.
- Staff sign in with Staff ID and password.
- Lecturer signup with `AC/1234` style Staff IDs.
- IPTTO signup with `AT/1024` style Staff IDs.
- Forgot password and reset password flow.
- Password policy requiring exactly 8 characters with uppercase, lowercase, number, and special symbol.
- Role based dashboards for lecturer, department administrator, faculty administrator, IPTTO officer, and super administrator.
- Direct browser uploads to Cloudflare R2 with signed URLs.
- PostgreSQL metadata storage through Drizzle ORM.
- Server side authorization checks for protected actions.
- Public statistics, dashboard summaries, audit logs, background job records, and rate limiting.

## Technology Stack

- TanStack Start, TanStack Router, and TanStack Query.
- React and Tailwind CSS.
- shadcn style UI primitives and lucide-react icons.
- Drizzle ORM and PostgreSQL.
- Better Auth with username based Staff ID sign in.
- Cloudflare R2 for file storage.
- Vitest and Playwright for testing.
- Vercel target deployment with Nitro.

## Project Structure

```text
src/application        Application services and use cases
src/components         Reusable UI components
src/domain             Domain models and rules
src/infrastructure     Database, storage, rate limit, and job adapters
src/lib                Auth, runtime helpers, validation, and shared utilities
src/presentation       Presentation level workflow helpers
src/repositories       Repository contracts and implementations
src/routes             TanStack route files and API handlers
docs                   Architecture, deployment, testing, and design notes
db                     Local database bootstrap files
drizzle                Generated database migrations
tests                  Unit, integration, and browser tests
```

## Requirements

- Node.js compatible with the project dependencies.
- pnpm 11.
- PostgreSQL for local or staging database use.
- Cloudflare R2 credentials for real file upload and download testing.
- Better Auth secret and trusted app URL.

## Environment Setup

Create a local environment file from the example:

```bash
cp .env.example .env.local
```

Fill these important values:

```bash
PUBLIC_BASE_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/oau_ippto
DATABASE_URL_POOLER=postgresql://postgres:postgres@localhost:5432/oau_ippto
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/oau_ippto_test
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=replace-with-a-long-random-secret
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:3000
R2_ACCOUNT_ID=
R2_BUCKET=oau-ippto-research
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_ENDPOINT=https://account-id.r2.cloudflarestorage.com
R2_PUBLIC_BASE_URL=
```

See `.env.example` for the complete list of variables.

## Install

```bash
pnpm install
```

## Database

Create the local PostgreSQL databases referenced by `DATABASE_URL` and `TEST_DATABASE_URL`, then run migrations:

```bash
pnpm db:migrate
```

For disposable local development databases, the schema can also be pushed directly:

```bash
pnpm db:push
```

Do not use `db:push` for production.

## Development

```bash
pnpm dev
```

The local app runs at:

```text
http://localhost:3000
```

## Auth Rules

Staff IDs are validated by role:

- Lecturer Staff IDs use `AC/` followed by exactly 4 digits, for example `AC/1234`.
- IPTTO, administrator, and super administrator Staff IDs use `AT/` followed by exactly 4 digits, for example `AT/1024`.

Passwords must be exactly 8 characters and include:

- At least one uppercase letter.
- At least one lowercase letter.
- At least one number.
- At least one special symbol.

Current public signup creates lecturer and IPTTO accounts. Admin approval is listed in `remaining-todo.md` as a production hardening item.

## File Uploads

The app stores file bytes in Cloudflare R2 only. PostgreSQL stores file metadata such as object key, bucket, filename, MIME type, size, access level, uploader, and related research record.

Upload flow:

1. Staff user creates or opens a submission.
2. Server validates the request and returns a short lived signed R2 upload URL.
3. Browser uploads the file directly to R2.
4. Browser confirms upload.
5. Server stores metadata and queues follow up jobs.

Private downloads use signed R2 download URLs after server side authorization.

## Testing

Run static checks:

```bash
pnpm check
```

Run unit and integration tests:

```bash
pnpm test
```

Install browser dependencies when needed:

```bash
pnpm test:e2e:install
```

Run browser tests:

```bash
pnpm test:e2e
```

Build the app:

```bash
pnpm build
```

## Production Deployment

The intended production target is Vercel with a managed PostgreSQL database and Cloudflare R2.

Before production launch:

- Configure all required Vercel environment variables.
- Configure Better Auth URL, trusted origins, and secret.
- Configure PostgreSQL with SSL, backups, and controlled migrations.
- Configure Cloudflare R2 bucket, credentials, endpoint, public base URL, and CORS.
- Run migrations through a controlled release process.
- Run the full unit, integration, browser, and build checks.
- Run staging smoke tests for signup, sign in, upload, publication visibility, dashboards, password reset, and sign out.

See `docs/deployment.md`, `docs/operations.md`, `docs/storage.md`, `docs/rate-limiting.md`, and `docs/background-jobs.md`.

## Remaining Production Work

See `remaining-todo.md` for the current production readiness checklist. The highest priority items are email delivery for password reset, admin approval onboarding, production seed workflow, deployed job processing, R2 staging verification, monitoring, and full staging smoke tests.

## Design Guidance

- Use `docs/design.md` as the design style guide.
- Use `design-inspo/dashboard inspo-1.jpg` for dashboard layout inspiration.
- Keep forms inside shadcn Card components.
- Keep non-admin dashboards responsive.
- Do not expand admin and super administrator dashboards for mobile responsiveness unless the product requirement changes.
