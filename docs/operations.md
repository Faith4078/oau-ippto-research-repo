# Operations Runbook

## Secrets

Store production secrets only in Vercel environment variables or Cloudflare Worker secrets. `.env.example` documents the required keys and must never contain real credentials.

## First Super Administrator

Super administrator accounts are never created through the public signup pages. Provision the first one from a trusted operator terminal or deployment job after database migrations have completed:

```powershell
$env:SUPER_ADMIN_STAFF_ID="AT/0001"
$env:SUPER_ADMIN_EMAIL="named.admin@oauife.edu.ng"
$env:SUPER_ADMIN_NAME="Named Platform Administrator"
$env:SUPER_ADMIN_PASSWORD="value-injected-by-your-secret-manager"
pnpm admin:bootstrap
```

The command requires a dedicated `AT/` Staff ID and a password of 15–128 characters. In one database transaction, it creates the Better Auth credential and OAU application account, assigns only the `super_administrator` role, and writes an audit event. It is safe to rerun only when that complete, audited provisioning record already exists. It refuses pre-registered, partial, or conflicting Staff ID and email records instead of elevating them.

Production procedure:

- Use a named, dedicated administrator identity; never a shared “admin” account.
- Inject the password from the deployment secret manager. Do not pass it as a command argument, paste it into source control, or leave it in a persistent `.env` file.
- Run the command from a trusted environment with temporary database access, then remove the four `SUPER_ADMIN_*` values.
- Sign in at `/sign-in` with the Staff ID and provisioned password.
- Enrol the account in MFA before routine production administration once MFA support is enabled. Until then, restrict use to emergency setup and tightly controlled operator access.
- Provision later administrators through an authenticated, audited administrative process rather than rerunning the bootstrap with shared credentials.

## Transactional Email

Configure `EMAIL_API_URL`, `EMAIL_API_TOKEN`, and `EMAIL_FROM`. The endpoint must accept an authenticated JSON request containing `from`, `to`, `subject`, `text`, and `html`. Password reset links are returned to the browser only when `PASSWORD_RESET_DEBUG=true` in a non-production environment; production ignores that flag. Delivery errors are logged without the recipient, reset token, or reset URL.

Operational checks:

- Send a password reset to an active staging account and confirm the link expires after one hour.
- Approve and reject staging accounts and confirm each status email arrives.
- Confirm provider logs and application error monitoring do not retain reset URLs.
- Rotate the provider token before launch and whenever exposure is suspected.

## File Storage

Cloudflare R2 is the source of file bytes. PostgreSQL stores metadata only. Large files must be uploaded and downloaded directly through short-lived signed URLs.

Operational checks:

- Upload URL expiry is short.
- Download URL expiry is short.
- R2 CORS allows only expected origins.
- Metadata is persisted only after upload confirmation.
- Private downloads require server-side authorization before URL creation.

## Rate Limiting

Apply rate limits to:

- Auth endpoints.
- Signed upload URL creation.
- Signed download URL creation.
- Search endpoints.

Log denied requests without storing sensitive credentials or file contents.

Implementation status: `src/application/rate-limit.ts` defines the contract and endpoint buckets. `PostgresRateLimitStore` backs the runtime limiter through the `rate_limit_windows` table so auth, signed upload URL, signed download URL, and search limits are shared across deployed app instances.

## Cache

Public catalogue, statistics, and discovery pages may be cached. Staff dashboards, authorization checks, private records, and signed URL endpoints must not be cached.

Revalidate public paths after:

- Research publication.
- Research archive.
- Innovation publication or archive.
- Patent publication or archive.
- Department, faculty, researcher, or report statistic changes.

## Background Jobs

Expensive work should move to workers or queues:

- AI summaries.
- Keyword extraction.
- Search indexing.
- Document metadata extraction.
- Retryable validation tasks.

Track job status as queued, retrying, completed, or failed. Super administrators need visibility into failed jobs before production readiness.

Implementation status: `src/application/jobs.ts` defines queue contracts for AI summaries, keyword extraction, search indexing, and document metadata extraction. `PostgresJobQueueRepository` persists runtime jobs in the `background_jobs` table. Failed jobs are visible only through the super-admin service contract and `/api/jobs/failed`.
