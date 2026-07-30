# Production Deployment

Verification date: July 30, 2026.

Official references checked:

- Vercel Nitro deployment: https://vercel.com/docs/frameworks/backend/nitro
- Vercel build configuration: https://vercel.com/docs/builds/configure-a-build
- Vercel environment variables: https://vercel.com/docs/environment-variables
- Vercel ISR and on-demand revalidation: https://vercel.com/docs/incremental-static-regeneration
- Vercel cache-control headers: https://vercel.com/docs/caching/cache-control-headers
- Cloudflare R2 presigned URLs: https://developers.cloudflare.com/r2/api/s3/presigned-urls/
- Cloudflare R2 Workers API: https://developers.cloudflare.com/r2/get-started/workers-api/
- Cloudflare Workers environment variables and secrets: https://developers.cloudflare.com/workers/local-development/environment-variables/
- Cloudflare Workers secrets: https://developers.cloudflare.com/workers/configuration/secrets/

## Target Runtime

Deploy the TanStack Start app as a Nitro app on Vercel. The current Vite config adds the Nitro plugin during production builds, so Vercel should run:

```bash
pnpm install --frozen-lockfile
pnpm build
```

Use pnpm only. In Vercel project settings, set the package manager to pnpm and keep the build command as `pnpm build`.

## PostgreSQL

Use a managed PostgreSQL provider such as Neon, Supabase, or a production PostgreSQL cluster.

Required production settings:

- Enable SSL.
- Use pooled connections for serverless runtime paths where the provider supports pooling.
- Keep migration access separate from application runtime access where possible.
- Run `pnpm db:migrate` from a controlled release job, not from request handlers.
- Back up production data before migrations that affect existing records.

Recommended Vercel environment variables:

```bash
DATABASE_URL=
DATABASE_URL_POOLER=
```

## Cloudflare R2

Store file bytes in Cloudflare R2 only. PostgreSQL stores object metadata: object key, bucket, filename, MIME type, byte size, checksum where available, access level, uploader ID, and related record IDs.

Use short-lived presigned URLs for direct browser uploads and private downloads:

- Server validates staff session, role permission, MIME type, extension, size limit, and requested access level.
- Server creates a short-lived presigned `PutObject` URL for uploads.
- Browser uploads directly to R2.
- Server persists metadata only after upload confirmation.
- Server creates short-lived presigned `GetObject` URLs for authorized private downloads.
- Do not proxy large files through Vercel functions.

Required R2 variables:

```bash
R2_ACCOUNT_ID=
R2_BUCKET=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_ENDPOINT=
R2_PUBLIC_BASE_URL=
R2_SIGNED_UPLOAD_EXPIRES_SECONDS=300
R2_SIGNED_DOWNLOAD_EXPIRES_SECONDS=300
MAX_UPLOAD_BYTES=52428800
ALLOWED_UPLOAD_MIME_TYPES=application/pdf,image/png,image/jpeg
```

Configure R2 CORS for browser uploads from production and preview origins.

## Workers and Background Jobs

Use Cloudflare Workers for background or file-adjacent jobs that should not run in request handlers. Candidate job types:

- AI summaries.
- Keyword extraction.
- Search indexing.
- Document metadata extraction.
- Retryable file validation.

Use Worker secrets for sensitive values. Cloudflare documents that plain Workers variables are visible configuration, while secrets hide values after definition.

Worker configuration should include:

```bash
WORKER_BASE_URL=
WORKER_SIGNING_SECRET=
JOB_QUEUE_NAME=
JOB_RETRY_LIMIT=3
JOB_RETRY_DELAY_SECONDS=60
```

Do not place R2 API secrets in public client variables.

## Vercel Environment Variables

Configure separate values for Development, Preview, and Production. Required keys:

```bash
PUBLIC_BASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
DATABASE_URL=
DATABASE_URL_POOLER=
R2_ACCOUNT_ID=
R2_BUCKET=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_ENDPOINT=
R2_PUBLIC_BASE_URL=
R2_SIGNED_UPLOAD_EXPIRES_SECONDS=
R2_SIGNED_DOWNLOAD_EXPIRES_SECONDS=
MAX_UPLOAD_BYTES=
ALLOWED_UPLOAD_MIME_TYPES=
WORKER_BASE_URL=
WORKER_SIGNING_SECRET=
JOB_QUEUE_NAME=
JOB_RETRY_LIMIT=
JOB_RETRY_DELAY_SECONDS=
REVALIDATION_SECRET=
CACHE_DEFAULT_SECONDS=
CACHE_PUBLIC_STATS_SECONDS=
RATE_LIMIT_AUTH_PER_MINUTE=
RATE_LIMIT_SIGNED_UPLOAD_PER_MINUTE=
RATE_LIMIT_SIGNED_DOWNLOAD_PER_MINUTE=
RATE_LIMIT_SEARCH_PER_MINUTE=
```

## Cache and Revalidation

Use cache headers only for public, non-sensitive responses. Private dashboard and staff data should use no-store behavior.

Recommended policy:

- Public static assets: long-lived immutable caching through Vercel output.
- Public statistics and read-only catalogue pages: bounded CDN cache with stale-while-revalidate where data freshness allows it.
- Staff dashboard, authorization checks, private records, and signed URL endpoints: no-store.
- Revalidation endpoint: protect with `REVALIDATION_SECRET`.
- Revalidate public catalogue, statistics, department, faculty, researcher, innovation, patent, and publication paths after publish/archive actions.

Vercel's ISR docs state that on-demand revalidation updates caches across regions quickly; still design UI workflows so a short freshness delay is acceptable.

## Release Checklist

1. Confirm `.env.example` contains every required key without real secrets.
2. Run `pnpm install --frozen-lockfile`.
3. Run `pnpm check`.
4. Run `pnpm test`.
5. Run `pnpm test:e2e`.
6. Run `pnpm build`.
7. Run database migrations from a controlled release context.
8. Verify R2 CORS, presigned upload, and private download behavior in preview.
9. Verify cache headers for public and private routes.
10. Promote the Vercel deployment after smoke tests pass.
