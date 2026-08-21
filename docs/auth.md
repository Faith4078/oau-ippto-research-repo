# Auth

## Current Scope

This pass adds staff sign-in runtime wiring, constrained staff signup, shared session contracts, protected route helpers, and central RBAC checks.

## Better Auth Staff ID Strategy

Verified on July 30, 2026 against the official Better Auth docs:

- Better Auth email and password auth is enabled with `emailAndPassword.enabled`.
- Better Auth recommends the username plugin when sign-in should use a username-style identifier instead of email.
- The username plugin adds `signIn.username` and the `/sign-in/username` flow, accepting `username` and `password`.
- The options reference exposes `emailAndPassword.disableSignUp`; the runtime now leaves signup enabled only behind the app's constrained Staff ID signup endpoint.
- Better Auth sessions are cookie-based by default; server-side session reads should pass request headers into the Better Auth session API when runtime auth is installed.
- Better Auth schema generation or migration is required after adding the username plugin.

Decision: treat OAU Staff ID as Better Auth `username`. The UI labels the field as Staff ID, then normalises it before sending `{ username, password }` to the Better Auth username sign-in endpoint. Staff ID comparison is case-insensitive because `src/lib/auth.ts` trims and lowercases the identifier before submission.

Runtime auth is mounted at `/api/auth/$` through TanStack Start and Better Auth. The app uses dedicated `auth_*` tables for Better Auth credentials and sessions, while the application `users`, profiles, roles, faculties, and departments remain the source of institutional authorization data.

Current server config:

```ts
import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins/username";
import { tanstackStartCookies } from "better-auth/tanstack-start";

export const auth = betterAuth({
	emailAndPassword: {
		enabled: true,
		disableSignUp: false,
		minPasswordLength: 8,
	},
	plugins: [username(), tanstackStartCookies()],
});
```

Expected session reader shape:

```ts
import { createAuthenticatedSessionState, createAnonymousSessionState } from "#/application/auth/session.ts";

export async function readAuthSession(request: Request) {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	if (!session) {
		return createAnonymousSessionState();
	}

	return createAuthenticatedSessionState({
		id: session.session.id,
		issuedAt: session.session.createdAt ?? null,
		expiresAt: session.session.expiresAt,
		user: {
			id: session.user.id,
			staffId: session.user.username,
			email: session.user.email ?? null,
			name: session.user.name,
			status: "active",
			roles: [],
			departmentId: null,
			facultyId: null,
		},
	});
}
```

Role, profile, department, and faculty fields should come from the application user/profile tables once the database agent finalises those schemas.

## Staff Sign-In UI

The `/sign-in` route provides:

- Staff ID field with `autocomplete="username"`.
- Password field with `autocomplete="current-password"`.
- A shadcn Card-based form.
- A POST to `/api/auth/sign-in/username`.
- User-facing invalid-credential and retry errors.

## Staff Sign-Up UI

Signup is role-constrained and uses the same Better Auth username strategy:

- `/sign-up/lecturer` collects first name, last name, Staff ID, institutional email, controlled faculty and department selections, and password.
- Lecturer Staff IDs must use `AC/` followed by exactly 4 digits, for example `AC/1234`.
- `/sign-up/iptto` collects name, Staff ID, institutional email, and password.
- IPTTO/admin Staff IDs must use `AT/` followed by exactly 4 digits, for example `AT/1302`.
- Passwords must be exactly 8 characters and include uppercase, lowercase, a number, and a special symbol.
- Both signup forms are embedded in shadcn Card surfaces.
- The public signup endpoint is `/api/auth/sign-up`.
- The endpoint maps the Staff ID to Better Auth `username` and uses a deterministic internal email only inside Better Auth. The application user stores the supplied email for recovery and account notifications.
- Public signup creates only `lecturer` or `iptto_officer` application roles. Department, faculty, and super administrator accounts are not created through public signup.
- New public accounts have `pending` status, receive no signup session cookie, and cannot pass server-side authorization until approved.
- `/api/admin/accounts` requires `users:manage`. It lists pending requests and applies validated approval, rejection, suspension, deactivation, or reactivation transitions.
- Every account-status change records the actor, previous status, new status, reason, IP address, and user agent in `audit_logs`.
- The super administrator dashboard contains the approval queue. Adverse decisions require a reason.

## Session and Route Protection

Shared auth contracts live under `src/application/auth`:

- `session.ts` defines `AuthSession`, `AuthUser`, `SessionState`, and `SessionReader`.
- `permissions.ts` defines required roles and the central role-to-permission matrix.
- `guards.ts` defines `authorizeSession`, `assertAuthorizedSession`, `requireRole`, `requirePermission`, and `createProtectedRouteGuard`.

Routes and server functions call these guards before returning protected data or performing protected actions. Navigation visibility can reuse the same permission matrix, but UI-only checks are not sufficient.

Dashboard route-side protection is wired through `src/lib/auth-functions.ts`. It uses a TanStack Start server function to read the incoming request with `getRequest()`, calls Better Auth through `readAuthSession`, enforces `dashboard:access`, and redirects unauthenticated users to `/sign-in`.

```ts
import { createFileRoute } from "@tanstack/react-router";
import { requireDashboardRouteAuth } from "#/lib/auth-functions.ts";

export const Route = createFileRoute("/dashboard")({
	beforeLoad: ({ location }) =>
		requireDashboardRouteAuth({ locationHref: location.href }),
});
```

Role workspaces add allowed-role checks in their route `beforeLoad`; for example, `/dashboard/super-admin` requires `super_administrator`. Server routes for submissions, approval transitions, and signed file URLs still authorize inside the route handler/application service, because route protection is not a data boundary.

## Roles and Permissions

Roles are imported from the shared domain type `RoleKey`:

- `visitor`
- `lecturer`
- `department_administrator`
- `faculty_administrator`
- `iptto_officer`
- `super_administrator`

The initial permission matrix is intentionally conservative:

- Visitors can read public content only.
- Lecturers can access the dashboard, create drafts, submit their own research, and request upload/download URLs for records they are allowed to access.
- Department administrators can review department submissions and read private research needed for that queue.
- Faculty administrators can review both department and faculty-level queues and read private research needed for those workflows.
- IPTTO officers can manage innovations, patents, commercialization work, and private supporting records relevant to IPTTO review.
- Super administrators receive every defined permission, including user, role, organization, audit, and failed-job visibility.

Record ownership and department/faculty scoping still need to be enforced inside application services and repositories once those flows are implemented. The central permission matrix answers whether a role may attempt an action; resource-level policy must still decide whether that user may act on the specific record.

## Account Policy Still Requiring Institutional Decisions

- Who approves department administrator, faculty administrator, and super administrator accounts?
- What happens when a staff member transfers departments?
- Which institutional email domains are permitted?

## Sources

- Better Auth Email & Password docs: https://better-auth.com/docs/authentication/email-password
- Better Auth Username plugin docs: https://better-auth.com/docs/plugins/username
- Better Auth Database docs: https://better-auth.com/docs/concepts/database
