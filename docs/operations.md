# Operations Runbook

## Secrets

Store production secrets only in Vercel environment variables or Cloudflare Worker secrets. `.env.example` documents the required keys and must never contain real credentials.

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
