# Rate Limiting

Rate limiting lives behind `src/application/rate-limit.ts`.

Protected buckets:

- `auth`
- `signed_upload_url`
- `signed_download_url`
- `search`

The runtime adapter is `PostgresRateLimitStore`, backed by the `rate_limit_windows` table so limits are shared across app instances. The in-memory adapter remains available for unit tests.

Denied requests return `RATE_LIMITED` with HTTP `429` and a `Retry-After` header when retry timing is available.

Current defaults:

- Auth: 10 requests per minute.
- Signed upload URL creation: 30 requests per minute.
- Signed download URL creation: 60 requests per minute.
- Search: 120 requests per minute.
