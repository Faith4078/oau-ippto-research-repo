# Storage

Verification date: July 30, 2026.

The repository stores file bytes in Cloudflare R2 only. PostgreSQL stores metadata only: object key, bucket, filename, MIME type, byte size, checksum when supplied, access level, uploader ID, and related record IDs.

## Flow

Uploads use short-lived signed `PUT` URLs:

1. The server validates staff authorization, MIME type, extension, byte size, and requested metadata.
2. The server returns a signed R2 URL plus the headers the browser must send.
3. The browser uploads directly to R2.
4. The app confirms the upload and persists PostgreSQL metadata.

The lecturer submission UI at `/dashboard/lecturer/submit` follows this flow:

1. `POST /api/research/submissions` creates the research record and validates the complete metadata payload with Zod.
2. `POST /api/files/signed-upload-url` returns a short-lived signed `PUT` URL for the selected file.
3. The browser sends the file directly to the signed R2 URL with the returned headers.
4. `POST /api/files/confirm-upload` saves the object key and file metadata in PostgreSQL.

Downloads use short-lived signed `GET` URLs. Private and restricted files must pass app authorization before a URL is created. The app server does not proxy file bytes.

## Environment

Required variables:

```bash
R2_ACCOUNT_ID=
R2_BUCKET=oau-ippto-research
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_SIGNED_UPLOAD_EXPIRES_SECONDS=300
R2_SIGNED_DOWNLOAD_EXPIRES_SECONDS=300
MAX_UPLOAD_BYTES=52428800
ALLOWED_UPLOAD_MIME_TYPES=application/pdf,image/png,image/jpeg
```

Signed URL expiries are capped at 900 seconds to keep upload and download URLs short-lived. R2 CORS must allow `PUT` from the production and preview origins and must allow the signed request headers returned by the server.

## SDK Dependencies

The current implementation uses Web Crypto and S3 Signature Version 4 directly, so no new dependency is required. If the project later chooses AWS SDK signing, use:

```bash
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```
