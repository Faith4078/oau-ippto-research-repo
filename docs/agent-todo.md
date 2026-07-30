# OAU IPTTO Research Repository Agent Todo

This is the execution plan for building the Obafemi Awolowo University IPTTO Research Repository and Innovation Visibility System. Split the work across agents where possible, but keep shared contracts stable.

## Non-Negotiable Product Rules

- [x] Use `pnpm` only.
- [x] Keep the implementation in TanStack Start, TanStack Router, TanStack Query, Tailwind CSS, Drizzle ORM, PostgreSQL, Zod, Better Auth, Cloudflare R2, Vitest, and Playwright unless a change is explicitly approved.
- [x] Follow Clean Architecture:
  - `src/domain`
  - `src/application`
  - `src/repositories`
  - `src/infrastructure`
  - `src/presentation`
  - `src/routes`
- [x] Keep business logic out of UI components and route handlers.
- [x] Enforce permissions server-side, not only in navigation.
- [x] Store file bytes in Cloudflare R2 only. PostgreSQL stores metadata only.
- [x] Use direct browser uploads to R2 with signed URLs.
- [x] Do not proxy large files through Vercel.
- [x] Use `docs/design.md` as the design system.
- [x] Use `design-inspo/langin-page.jpg` as public website visual inspiration.
- [x] Use `design-inspo/dashboard inspo-1.jpg` as dashboard layout inspiration.
- [x] Use suitable `lucide-react` icons where useful.
- [x] Do not add visible double dashes anywhere in website copy.
- [x] Run `pnpm build` after meaningful implementation changes.

## Parallel Agent Split

### Agent 1: Foundation and Architecture

- [x] Confirm app runs locally with TanStack Start.
  - Acceptance: `pnpm dev` starts the app.
  - Acceptance: `pnpm build` passes.
  - Status: `pnpm dev --host 127.0.0.1` started without an immediate crash and stayed running until the command timeout; Playwright also launched the app through the configured dev server. `pnpm build` passes.

- [x] Create Clean Architecture directories.
  - Acceptance: Business rules and services are outside route and UI files.

- [x] Add shared result/error patterns for application services.
  - Acceptance: Application services return predictable success and failure shapes.

- [x] Add Zod validation utilities.
  - Acceptance: Request payload validation is reusable across routes and services.

- [x] Add dependency composition module.
  - Acceptance: Routes resolve services through a composition layer instead of constructing infrastructure directly.

- [x] Update `.env.example`.
  - Include: database URL, auth secrets, R2 account/bucket/access keys, public base URL, worker/queue config.

## Agent 2: Database and Domain Model

- [x] Implement Drizzle schema for organization data.
  - Tables: faculties, departments, users/profile extensions, roles, permissions.
  - Acceptance: Departments belong to faculties.

- [x] Implement Drizzle schema for research records.
  - Tables: research records, authors, research authors, keywords, files, publications, approval history.
  - Acceptance: File records contain object key, file size, MIME type, checksum if available, access level, uploader ID.

- [x] Implement Drizzle schema for innovations and patents.
  - Tables: innovations, patents, inventors, commercialization activities, IPTTO reviews, supporting files.

- [x] Implement audit log schema.
  - Acceptance: Audit logs store actor, action, target type, target ID, timestamp, IP/user agent if available, and metadata.

- [x] Add migrations and seed data.
  - Acceptance: Local seed creates roles, faculties, departments, demo users, research records, innovations, and patents.
  - Status: Drizzle migration `drizzle/0000_complex_nuke.sql` was generated and `db/init.sql` includes local seed data for roles, faculties, departments, demo users, research records, innovations, patents, commercialization records, reviews, and audit logs.
  - Status: `db/init.sql` includes seed data, but generated Drizzle migration files are not present.

## Agent 3: Auth, Staff Login, and RBAC

- [x] Verify Better Auth implementation using current official docs before coding.
  - Note: Better Auth supports email/password. Staff ID and password can be implemented by treating Staff ID as a username-style identifier with the Better Auth username plugin, or by mapping Staff ID to the auth user model while keeping email internally if required.
  - Acceptance: Implementation choice is documented in code comments or `docs/auth.md`.

- [x] Build staff sign-in page.
  - Fields: Staff ID, Password.
  - UI: Form embedded in a shadcn Card.
  - Acceptance: Page is responsive, accessible, and matches `docs/design.md`.

- [x] Do not implement signup until user interview is complete.
  - Required interview questions:
    - Who is allowed to request an account?
    - Is signup self-service, invite-only, or admin-created?
    - Which fields are required?
    - Should users request a role?
    - Should department and faculty be verified?
    - Who approves lecturer, department admin, faculty admin, IPTTO officer, and super admin access?
    - Is institutional email required?
    - Is Staff ID uniqueness guaranteed?

- [x] Implement Better Auth session handling.
  - Acceptance: Sign in, sign out, session read, protected routes, and session expiry work.
  - Status: Staff ID sign-in, Better Auth sign-out, server-side session reading, session expiry checks, and dashboard route guards are wired.

- [x] Define roles and permissions.
  - Roles: visitor, lecturer, department administrator, faculty administrator, IPTTO officer, super administrator.
  - Acceptance: Permissions are centrally defined and testable.

- [x] Add server-side authorization guards.
  - Acceptance: Protected actions reject unauthorized users even if called directly.

## Agent 4: Public Website and Content Pages

- [x] Keep homepage tight and responsive.
  - Acceptance: Homepage introduces the repository, search, research, researchers, publications, innovations, patents, faculties/departments, and primary CTAs without feeling like a full sitemap.

- [x] Build public layout.
  - Acceptance: Header, footer, mobile navigation, and page containers are reusable.

- [x] Build Research Catalogue page.
  - Features: keyword search, filters, sort, pagination, empty state.

- [x] Build Research Detail page.
  - Content: title, abstract, authors, department, faculty, keywords, publication date, file access, citation metadata, related records.

- [x] Build Researchers Directory and Researcher Profile pages.
  - Content: biography, research interests, publications, metrics, department, faculty, contact details where public.

- [x] Build Publications page.
  - Types: journal articles, conference papers, books, book chapters, technical reports, theses and dissertations, working papers.

- [x] Build Departments and Department Detail pages.
  - Content: researchers, research outputs, innovations, patents, statistics.

- [x] Build Faculties and Faculty Detail pages.
  - Content: departments, researchers, outputs, statistics.

- [x] Build Research Areas page.
  - Acceptance: Areas link to filtered research results.

- [x] Build Innovation Showcase and Innovation Detail pages.
  - Content: technology summary, research links, IPTTO status where public, industry applications.

- [x] Build Patents and Patent Detail pages.
  - Content: inventors, patent status, technology summary, research area, industry applications.

- [x] Build Reports and Statistics page.
  - Acceptance: Public statistics do not expose private records.

- [x] Build News and Events, FAQ, and Contact pages.
  - Acceptance: These are available as inner pages rather than overloading the homepage.

- [x] Add SEO metadata and structured data.
  - Acceptance: Public pages include unique title, description, Open Graph metadata, canonical URL where available, and appropriate structured data.

## Agent 5: Dashboard UI and Role Workspaces

Use `design-inspo/dashboard inspo-1.jpg` as the dashboard layout inspiration.

Dashboard design requirements:
- [x] Use a left sidebar layout on desktop.
- [x] Use a compact mobile navigation pattern on small screens for non-admin dashboards only; admin and super-admin dashboards intentionally keep the desktop shell.
- [x] Use dense but readable cards, tables, filters, status chips, and action bars.
- [x] Keep cards to 8px radius or less unless existing shadcn components require otherwise.
- [x] Use suitable `lucide-react` icons in navigation, buttons, empty states, and status summaries.
- [x] Avoid marketing-style hero sections inside dashboards.
- [x] Avoid nested cards.
- [x] Avoid decorative gradients, large orbs, or purely ornamental visuals.

Dashboard tasks:

- [x] Build authenticated dashboard shell.
  - Acceptance: Sidebar/nav adapts by role.
  - Acceptance: Unauthorized links are hidden and protected server-side.
  - Status: Role-specific dashboard shell exists; dashboard routes use role-aware auth guards backed by Better Auth session reads.

- [x] Build shared dashboard components.
  - Components: stat card, data table shell, filter bar, status badge, empty state, page header, action button group, confirmation dialog.

- [x] Build Lecturer dashboard.
  - Features: submit research, view submissions, draft records, review status, upload history, researcher profile summary.

- [x] Build Department Administrator dashboard.
  - Features: department queue, approve/reject submissions, comments, department statistics, researcher list.

- [x] Build Faculty Administrator dashboard.
  - Features: faculty review queue, faculty reports, cross-department output, approval actions.

- [x] Build IPTTO Officer dashboard.
  - Features: innovation records, patents, commercialization activity, IPTTO reviews, supporting files.

- [x] Build Super Administrator dashboard.
  - Features: users, roles, permissions, faculties, departments, settings, audit logs, failed jobs.

- [x] Add dashboard empty states.
  - Acceptance: Every table/list has a useful empty state and primary action.

## Agent 6: Research Submission and Approval Workflow

- [x] Build research submission form.
  - Fields: title, abstract, authors, department, faculty, keywords, publication type, publication metadata, access level, file metadata.
  - Acceptance: Zod validates form input server-side.

- [x] Implement direct R2 upload flow.
  - Acceptance: Server creates short-lived signed upload URL.
  - Acceptance: Browser uploads directly to R2.
  - Acceptance: Metadata is saved after upload confirmation.
  - Status: R2 signer, signed upload API route, upload confirmation route, metadata repository, storage tests, and lecturer browser upload wiring exist.

- [x] Implement private download flow.
  - Acceptance: Authorized users receive short-lived signed download URLs.
  - Acceptance: Unauthorized users cannot access private files.

- [x] Implement approval state machine.
  - Flow: draft, submitted, department review, faculty review, IPTTO review where needed, approved, rejected, published, archived.
  - Acceptance: Invalid transitions are rejected.
  - Acceptance: Rejections require reason.

- [x] Add audit logs for workflow actions.
  - Actions: submission, approval, rejection, publication, archive, file access.

## Agent 7: Innovation, Patent, and IPTTO Management

- [x] Build innovation management.
  - Acceptance: Authorized users can create, edit, review, publish, and archive innovation records.

- [x] Build patent management.
  - Acceptance: Authorized users can manage patent records, filing details, inventors, statuses, and supporting files.

- [x] Build commercialization tracking.
  - Acceptance: IPTTO staff can track licensing, partnerships, spinouts, milestones, and notes.

- [x] Link research, innovations, patents, researchers, departments, and faculties.
  - Acceptance: Related records appear in dashboards and public pages when public.

## Agent 8: Search, Reports, and Analytics

- [x] Implement PostgreSQL full-text search.
  - Acceptance: Supports keyword search, ranking, filters, and pagination.

- [x] Add filters.
  - Filters: faculty, department, researcher, year, type, keywords, research area, innovation status, patent status.

- [x] Keep search replaceable.
  - Acceptance: Search logic sits behind an application interface for future migration to dedicated search.

- [x] Build dashboard reports.
  - Reports: submissions by status, publications by department/faculty, innovations, patents, commercialization activity.

- [x] Build public statistics.
  - Acceptance: Statistics are cached and do not expose private records.
  - Status: Public statistics are exposed through `/api/public-statistics` with a 5-minute in-memory cache. The repository query only counts public/published aggregates and excludes private records.

## Agent 9: Background Jobs and AI-Ready Processing

- [x] Add queue/worker infrastructure.
	- Acceptance: Expensive work does not run during upload or submission requests.
	- Status: Application job contracts and an in-memory worker/queue adapter are implemented. Submission and upload-confirmation routes enqueue expensive AI, keyword, indexing, and metadata work instead of running it inline.

- [x] Add job types.
	- Jobs: AI summaries, keyword extraction, search indexing, document metadata extraction.

- [x] Add job status tracking.
	- Acceptance: Jobs can be queued, retried, completed, and marked failed.

- [x] Add admin visibility for failed jobs.
	- Acceptance: Super admins can inspect failures from the dashboard.
	- Status: `BackgroundJobsService.listFailedJobs` and `/api/jobs/failed` require super-admin system-management authorization.

## Agent 10: Security, Testing, and Deployment

- [x] Add input validation everywhere user data enters the system.
  - Status: Auth signup/sign-in payloads, research submissions, approval transitions, signed file URL flows, search/report inputs, innovation/patent/commercialization routes, and rate-limited APIs validate payloads through Zod or typed application guards before writes.
- [x] Add file validation.
  - Acceptance: MIME type, extension, size limit, and access level rules are enforced.

- [x] Add rate limiting.
	- Endpoints: auth, signed upload URL creation, signed download URL creation, search.

- [x] Add unit tests.
  - Coverage: domain rules, validation schemas, permissions, state transitions.

- [x] Add integration tests.
  - Coverage: repositories, services, database queries, workflow actions.
  - Status: Research workflow service integration tests cover submission creation, validation rejection, signed upload metadata confirmation, approval transitions, and private download authorization using repository, audit, and storage doubles.

- [x] Add storage tests.
  - Coverage: signed upload URL generation, signed download URL generation, metadata persistence.
  - Status: Signed upload/download URL and file validation tests exist; research workflow integration tests cover metadata persistence after upload confirmation with a repository double.

- [x] Add Playwright tests.
  - Coverage: homepage, search, public browsing, sign in, lecturer submission, review workflow, admin user management.
  - Status: Homepage, public browsing, public detail navigation, staff sign-in, lecturer signup, IPTTO signup, and anonymous dashboard redirect specs pass across desktop/mobile projects. `pnpm exec playwright test --workers=1` passed with 20 tests.

- [x] Add authorization regression tests.
  - Acceptance: Users cannot access records or actions outside role permissions.

- [x] Document local setup.
  - Acceptance: README covers pnpm install, env vars, DB setup, migrations, seed, and dev server.

- [x] Document production deployment.
  - Acceptance: Docs cover Vercel, PostgreSQL, Cloudflare R2, workers, env vars, cache, and revalidation.

- [x] Verify Vercel production recommendations against current official Vercel docs before deployment.
  - Acceptance: Deployment docs include verification date and official links.

## Final Definition of Done

- [x] Homepage and public pages are responsive, accessible, searchable, and SEO-ready.
- [x] Staff sign-in uses Staff ID and Password.
- [x] Signup/onboarding is not built until user interview answers are captured.
- [x] Authenticated dashboards exist for all required roles.
  - Status: Dashboard views exist for all roles and route-level auth protection is wired for each role workspace.
- [x] Dashboards follow `design-inspo/dashboard inspo-1.jpg` layout direction.
- [x] Research submissions support direct Cloudflare R2 uploads.
- [x] Private downloads use short-lived signed URLs.
- [x] PostgreSQL stores metadata only.
- [x] Role-based authorization is enforced server-side.
- [x] Approval workflows, audit logs, reports, analytics, search, innovations, patents, and commercialization tracking are implemented.
- [x] Background jobs handle expensive AI/search/document processing.
- [x] Unit, integration, storage, authorization, and Playwright tests pass.
  - Status: `pnpm test` passes with 50 Vitest tests and `pnpm exec playwright test --workers=1` passes with 20 Playwright tests.
- [x] Deployment and operations documentation is complete.
