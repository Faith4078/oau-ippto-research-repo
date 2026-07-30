import { randomBytes, randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { z } from "zod";

import { getDatabaseUrl } from "#/db/env.ts";
import * as schema from "#/infrastructure/db/schema.ts";

import {
	isAdministrativeStaffId,
	isLecturerStaffId,
	normalizeStaffId,
} from "./auth.ts";
import { auth } from "./auth-runtime.ts";
import { isValidPassword, passwordPolicyText } from "./password-policy.ts";

const resetTokenTtlMs = 60 * 60 * 1000;

const staffIdSchema = z
	.string()
	.trim()
	.min(1, "Staff ID is required.")
	.refine(
		(value) => isLecturerStaffId(value) || isAdministrativeStaffId(value),
		"Staff ID must use AC/ or AT/ followed by exactly 4 digits, for example AC/1234 or AT/1302.",
	);

const resetRequestSchema = z.object({
	staffId: staffIdSchema,
});

const resetCompleteSchema = z.object({
	token: z.string().trim().min(1, "Reset token is required."),
	password: z
		.string()
		.length(8, "Password must be exactly 8 characters.")
		.refine(isValidPassword, passwordPolicyText),
});

export async function handleStaffPasswordResetRequest(request: Request) {
	const body = await request.json().catch(() => null);
	const parsed = resetRequestSchema.safeParse(body);

	if (!parsed.success) {
		const flattened = z.flattenError(parsed.error);

		return Response.json(
			{
				error: {
					code: "VALIDATION_FAILED",
					message: "Enter a valid Staff ID.",
					fieldErrors: flattened.fieldErrors,
				},
			},
			{ status: 422 },
		);
	}

	const databaseUrl = getDatabaseUrl();

	if (!databaseUrl) {
		return Response.json(
			{
				error: {
					code: "DATABASE_UNAVAILABLE",
					message: "Password reset needs a configured database.",
				},
			},
			{ status: 503 },
		);
	}

	const reset = await createResetTokenForStaffId(
		databaseUrl,
		parsed.data.staffId,
		request.url,
	);

	return Response.json({
		data: {
			accepted: true,
			expiresAt: reset?.expiresAt.toISOString() ?? null,
			resetUrl: reset?.resetUrl ?? null,
		},
	});
}

export async function handleStaffPasswordResetComplete(request: Request) {
	const body = await request.json().catch(() => null);
	const parsed = resetCompleteSchema.safeParse(body);

	if (!parsed.success) {
		const flattened = z.flattenError(parsed.error);

		return Response.json(
			{
				error: {
					code: "VALIDATION_FAILED",
					message: "Check the highlighted password reset fields.",
					fieldErrors: flattened.fieldErrors,
				},
			},
			{ status: 422 },
		);
	}

	const resetResponse = await auth.handler(
		new Request(new URL("/api/auth/reset-password", request.url), {
			body: JSON.stringify({
				newPassword: parsed.data.password,
				token: parsed.data.token,
			}),
			headers: {
				"content-type": "application/json",
			},
			method: "POST",
		}),
	);

	if (!resetResponse.ok) {
		return Response.json(
			{
				error: {
					code: "INVALID_OR_EXPIRED_TOKEN",
					message: "This reset link is invalid or has expired.",
				},
			},
			{ status: 400 },
		);
	}

	return Response.json({
		data: {
			status: true,
		},
	});
}

async function createResetTokenForStaffId(
	databaseUrl: string,
	staffId: string,
	requestUrl: string,
) {
	const database = drizzle(databaseUrl, { schema });
	const normalizedStaffId = normalizeStaffId(staffId);
	const [account] = await database
		.select({
			authUserId: schema.authUser.id,
			status: schema.users.status,
		})
		.from(schema.users)
		.innerJoin(schema.authUser, eq(schema.authUser.email, schema.users.email))
		.where(eq(schema.users.staffId, normalizedStaffId))
		.limit(1);

	if (!account || account.status !== "active") {
		return null;
	}

	const token = randomBytes(24).toString("base64url");
	const expiresAt = new Date(Date.now() + resetTokenTtlMs);

	await database.insert(schema.authVerification).values({
		createdAt: new Date(),
		expiresAt,
		id: randomUUID(),
		identifier: `reset-password:${token}`,
		updatedAt: new Date(),
		value: account.authUserId,
	});

	const resetUrl = new URL("/reset-password", requestUrl);
	resetUrl.searchParams.set("token", token);

	return {
		expiresAt,
		resetUrl: resetUrl.pathname + resetUrl.search,
	};
}
