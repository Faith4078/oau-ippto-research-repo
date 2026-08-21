import type { SessionState } from "#/application/auth/session.ts";
import type { AuthenticatedActor } from "#/application/authorization.ts";
import type { RateLimitBucket } from "#/application/rate-limit.ts";
import type { ApplicationError, Result } from "#/application/result.ts";
import type { EntityId } from "#/domain/index.ts";
import { createRuntimeRateLimiter } from "#/infrastructure/app-services.ts";

export function actorFromSession(
	sessionState: SessionState,
): AuthenticatedActor | null {
	if (sessionState.status !== "authenticated") {
		return null;
	}

	const user = sessionState.session.user;

	return {
		userId: user.id,
		status: user.status,
		roles: user.roles.map((role) => ({
			role,
			facultyId: user.facultyId,
			departmentId: user.departmentId,
		})),
	};
}

export function auditContextFromRequest(request: Request) {
	return {
		ipAddress:
			request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
		userAgent: request.headers.get("user-agent"),
	};
}

export async function readJsonBody(request: Request): Promise<unknown> {
	if (!request.body) {
		return {};
	}

	return request.json();
}

export function jsonResult<T>(result: Result<T>): Response {
	if (result.ok) {
		return Response.json({ data: result.value });
	}

	return jsonError(result.error);
}

export function jsonError(error: ApplicationError): Response {
	const headers = new Headers();
	const retryAfterSeconds = retryAfterSecondsFromCause(error.cause);

	if (retryAfterSeconds) {
		headers.set("Retry-After", String(retryAfterSeconds));
	}

	return Response.json(
		{
			error: {
				code: error.code,
				message: error.message,
				cause: error.cause,
			},
		},
		{ headers, status: statusForError(error.code) },
	);
}

export async function enforceRateLimit(
	request: Request,
	bucket: RateLimitBucket,
	identityOverride?: string | null,
): Promise<Response | null> {
	const identity = identityOverride ?? rateLimitIdentityFromRequest(request);
	const decision = await createRuntimeRateLimiter().check({ bucket, identity });

	if (!decision.ok) {
		return jsonError(decision.error);
	}

	return null;
}

export function parseObjectKey(payload: unknown): string | null {
	if (
		payload &&
		typeof payload === "object" &&
		"objectKey" in payload &&
		typeof payload.objectKey === "string"
	) {
		return payload.objectKey;
	}

	return null;
}

export function asEntityId(value: string): EntityId {
	return value as EntityId;
}

function statusForError(code: string): number {
	if (code === "RATE_LIMITED") {
		return 429;
	}

	if (code === "AUTHENTICATION_REQUIRED") {
		return 401;
	}

	if (code === "FORBIDDEN") {
		return 403;
	}

	if (code === "VALIDATION_FAILED") {
		return 422;
	}

	if (code === "ACCOUNT_STATUS_CONFLICT") {
		return 409;
	}

	if (code === "ACCOUNT_NOTIFICATION_FAILED") {
		return 503;
	}

	if (code.endsWith("_NOT_FOUND")) {
		return 404;
	}

	return 400;
}

function rateLimitIdentityFromRequest(request: Request) {
	const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0];
	const ipAddress =
		forwardedFor?.trim() ||
		request.headers.get("x-real-ip")?.trim() ||
		"unknown-ip";
	const userAgent =
		request.headers.get("user-agent")?.slice(0, 80) ?? "unknown";

	return `${ipAddress}:${userAgent}`;
}

function retryAfterSecondsFromCause(cause: unknown) {
	if (
		cause &&
		typeof cause === "object" &&
		"retryAfterSeconds" in cause &&
		typeof cause.retryAfterSeconds === "number"
	) {
		return cause.retryAfterSeconds;
	}

	return null;
}
