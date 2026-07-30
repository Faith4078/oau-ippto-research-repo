# Remaining Production Todo

This file lists the remaining work needed to make the OAU IPTTO Research Repository production grade from end to end.

## 1. Password reset email delivery

- Add a real email provider for forgot password links.
- Stop showing reset links directly in the forgot password UI outside local or staging debug mode.
- Add email templates for password reset, account approval, rejection, and account status changes.
- Add tests that confirm reset links are sent and expire correctly.

## 2. Admin approval for signup

- Change lecturer and IPTTO signup from immediate access to pending approval when the institution is ready.
- Add an approval queue for super administrators or nominated administrators.
- Record approval, rejection, suspension, and reactivation in audit logs.
- Add clear staff account states such as pending, active, rejected, suspended, and deactivated.

## 3. Controlled organization data

- Replace free text faculty and department fields with controlled selections from the database.
- Validate that a lecturer department belongs to the selected faculty.
- Add administrator tools to create, update, merge, and archive faculties and departments.
- Define what happens when a staff member transfers department or faculty.

## 4. Real staging verification

- Run a full staging smoke test with production-like PostgreSQL and Cloudflare R2.
- Verify lecturer signup with `AC/1234` format and exact 8 character password policy.
- Verify IPTTO signup with `AT/1024` format and exact 8 character password policy.
- Verify a lecturer can upload a research file directly to R2.
- Verify the uploaded research appears on the public research catalogue after publication.
- Verify the lecturer dashboard shows the same record as published.
- Verify private files remain inaccessible without authorization.
- Verify sign out clears the dashboard session.

## 5. Background job processing

- Add an actual deployed worker or scheduled worker process that consumes queued jobs.
- Implement real handlers for AI summaries, keyword extraction, search indexing, and document metadata extraction.
- Add retry behavior, dead letter handling, and alerting for repeated failures.
- Add a super administrator screen for retrying or dismissing failed jobs.

## 6. Search and cache production hardening

- Confirm PostgreSQL full text indexes exist in the production migration.
- Add cache headers only to public pages and public APIs.
- Ensure dashboard APIs, private records, auth routes, and signed URL routes are never cached.
- Add revalidation after publishing or archiving research, innovations, patents, departments, faculties, researchers, and reports.

## 7. Production database operations

- Confirm generated Drizzle migrations match the current schema.
- Run migrations through a controlled release process.
- Add database backups and restore testing.
- Add a seed script for required roles, permissions, faculties, departments, and the first super administrator.
- Separate migration credentials from runtime application credentials where the hosting provider supports it.

## 8. Security and compliance hardening

- Rotate all staging secrets before production launch.
- Confirm Better Auth trusted origins match production and preview domains.
- Configure secure cookies, HTTPS-only access, and strict production origin settings.
- Review audit log coverage for auth, uploads, downloads, approvals, publishing, admin changes, and failed jobs.
- Define file retention, privacy, and data removal policies.
- Add a production incident response checklist.

## 9. R2 operations

- Configure R2 CORS for production and preview domains only.
- Verify direct browser uploads work for allowed file types and size limits.
- Verify signed download URLs expire as configured.
- Add lifecycle rules if the institution wants automatic cleanup for archived or abandoned files.
- Add monitoring for upload failures and storage growth.

## 10. Observability

- Add structured server logs without passwords, reset tokens, signed URLs, or file contents.
- Add error monitoring for route handlers, server functions, uploads, and workers.
- Add basic uptime checks for public pages, auth, database access, and R2 signing.
- Add alerts for failed migrations, repeated auth failures, job backlog growth, and R2 upload errors.

## 11. End to end test coverage

- Add Playwright tests for real lecturer signup, sign in, upload, publish visibility, lecturer dashboard visibility, and sign out.
- Add Playwright tests for IPTTO signup, sign in, dashboard data, and sign out.
- Add browser coverage for department administrator, faculty administrator, and super administrator dashboards.
- Run the full Playwright suite against staging before every release.

## 12. Production launch checklist

- Fill all production environment variables in Vercel.
- Fill all R2 credentials and CORS settings in Cloudflare.
- Create the first super administrator through a controlled script or one-time secure process.
- Run migrations.
- Run smoke tests.
- Confirm no real secrets are committed.
- Confirm password reset emails work.
- Confirm public pages and dashboards behave correctly on the target devices.
- Promote only after staging smoke tests pass.
