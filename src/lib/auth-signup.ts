import { and, eq, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { z } from "zod";

import { getDatabaseUrl } from "#/db/env.ts";
import type { EntityId } from "#/domain/common.ts";
import type { RoleKey } from "#/domain/organization.ts";
import * as schema from "#/infrastructure/db/schema.ts";

import {
	buildStaffSignUpPayload,
	isAdministrativeStaffId,
	isLecturerStaffId,
	normalizeStaffId,
	type StaffSignUpInput,
} from "./auth.ts";
import { auth } from "./auth-runtime.ts";
import { isValidPassword, passwordPolicyText } from "./password-policy.ts";

const passwordSchema = z
	.string()
	.length(8, "Password must be exactly 8 characters.")
	.refine(isValidPassword, passwordPolicyText);

const lecturerSignUpSchema = z
	.object({
		kind: z.literal("lecturer"),
		firstName: z.string().trim().min(1, "First name is required."),
		lastName: z.string().trim().min(1, "Last name is required."),
		staffId: z.string().trim().min(1, "Staff ID is required."),
		email: z.email("Enter a valid institutional email address."),
		facultyId: z.uuid("Select a valid faculty."),
		departmentId: z.uuid("Select a valid department."),
		password: passwordSchema,
	})
	.refine((input) => isLecturerStaffId(input.staffId), {
		message:
			"Lecturer Staff ID must use AC/ followed by exactly 4 digits, for example AC/1234.",
		path: ["staffId"],
	});

const ipttoSignUpSchema = z
	.object({
		kind: z.literal("iptto"),
		name: z.string().trim().min(1, "Name is required."),
		staffId: z.string().trim().min(1, "Staff ID is required."),
		email: z.email("Enter a valid institutional email address."),
		password: passwordSchema,
	})
	.refine((input) => isAdministrativeStaffId(input.staffId), {
		message:
			"IPTTO/admin Staff ID must use AT/ followed by exactly 4 digits, for example AT/1302.",
		path: ["staffId"],
	});

export const staffSignUpSchema = z.discriminatedUnion("kind", [
	lecturerSignUpSchema,
	ipttoSignUpSchema,
]);

export type StaffSignUpValidationResult =
	| {
			ok: true;
			value: StaffSignUpInput;
	  }
	| {
			ok: false;
			message: string;
			fieldErrors: Record<string, string[]>;
	  };

export function validateStaffSignUpInput(
	payload: unknown,
): StaffSignUpValidationResult {
	const parsed = staffSignUpSchema.safeParse(payload);

	if (parsed.success) {
		return {
			ok: true,
			value: parsed.data,
		};
	}

	const flattened = z.flattenError(parsed.error);

	return {
		ok: false,
		message: "Check the highlighted signup fields.",
		fieldErrors: flattened.fieldErrors,
	};
}

export async function handleStaffSignUpRequest(request: Request) {
	const body = await request.json().catch(() => null);
	const validation = validateStaffSignUpInput(body);

	if (!validation.ok) {
		return Response.json(
			{
				error: {
					code: "VALIDATION_FAILED",
					message: validation.message,
					fieldErrors: validation.fieldErrors,
				},
			},
			{ status: 422 },
		);
	}

	const duplicate = await findExistingApplicationUser(
		validation.value.staffId,
		validation.value.email,
	);

	if (duplicate) {
		return Response.json(
			{
				error: {
					code: "STAFF_ACCOUNT_EXISTS",
					message: "An account already exists for this Staff ID.",
				},
			},
			{ status: 409 },
		);
	}

	let organizationScope = { facultyId: null, departmentId: null } as {
		facultyId: EntityId | null;
		departmentId: EntityId | null;
	};
	if (validation.value.kind === "lecturer") {
		try {
			organizationScope = await readLecturerOrganizationScope(
				validation.value.facultyId,
				validation.value.departmentId,
			);
		} catch (error) {
			if (error instanceof InvalidOrganizationSelectionError) {
				return Response.json(
					{
						error: {
							code: "INVALID_ORGANIZATION_SELECTION",
							message: error.message,
							fieldErrors: { departmentId: [error.message] },
						},
					},
					{ status: 422 },
				);
			}
			throw error;
		}
	}

	const authResponse = await createBetterAuthStaffAccount(
		request,
		validation.value,
	);

	if (!authResponse.ok) {
		return authResponse;
	}

	const persistedUser = await createApplicationUser(
		validation.value,
		organizationScope,
	);

	return Response.json(
		{
			data: {
				userId: persistedUser?.id ?? null,
				role: roleForSignUp(validation.value.kind),
				applicationUserCreated: Boolean(persistedUser),
				status: "pending",
			},
		},
		{
			status: 201,
		},
	);
}

async function createBetterAuthStaffAccount(
	request: Request,
	input: StaffSignUpInput,
) {
	const url = new URL("/api/auth/sign-up/email", request.url);
	const headers = new Headers(request.headers);

	headers.set("content-type", "application/json");

	return auth.handler(
		new Request(url, {
			body: JSON.stringify(buildStaffSignUpPayload(input)),
			headers,
			method: "POST",
		}),
	);
}

async function findExistingApplicationUser(staffId: string, email: string) {
	const databaseUrl = getDatabaseUrl();

	if (!databaseUrl) {
		return false;
	}

	const database = drizzle(databaseUrl, { schema });
	const rows = await database
		.select({ id: schema.users.id })
		.from(schema.users)
		.where(
			or(
				eq(schema.users.staffId, normalizeStaffId(staffId)),
				eq(schema.users.email, email),
			),
		)
		.limit(1);

	return rows.length > 0;
}

async function createApplicationUser(
	input: StaffSignUpInput,
	organizationScope: {
		facultyId: EntityId | null;
		departmentId: EntityId | null;
	},
) {
	const databaseUrl = getDatabaseUrl();

	if (!databaseUrl) {
		return null;
	}

	const database = drizzle(databaseUrl, { schema });
	const roleKey = roleForSignUp(input.kind);
	const staffId = normalizeStaffId(input.staffId);
	const authPayload = buildStaffSignUpPayload(input);
	return database.transaction(async (transaction) => {
		const [user] = await transaction
			.insert(schema.users)
			.values({
				email: input.email.trim().toLowerCase(),
				emailVerified: false,
				name: authPayload.name,
				staffId,
				status: "pending",
			})
			.returning({ id: schema.users.id });

		if (!user) {
			throw new Error("Unable to create application user.");
		}

		await transaction.insert(schema.userProfiles).values({
			departmentId: organizationScope.departmentId,
			facultyId: organizationScope.facultyId,
			publicEmail: null,
			recoveryEmail: input.email.trim().toLowerCase(),
			userId: user.id,
		});

		const [role] = await transaction
			.select({ id: schema.roles.id })
			.from(schema.roles)
			.where(eq(schema.roles.key, roleKey))
			.limit(1);

		if (!role) {
			throw new Error(`Missing system role: ${roleKey}`);
		}

		await transaction.insert(schema.userRoles).values({
			departmentId: organizationScope.departmentId,
			facultyId: organizationScope.facultyId,
			roleId: role.id,
			userId: user.id,
		});

		return {
			id: user.id as EntityId,
		};
	});
}

async function readLecturerOrganizationScope(
	facultyId: string,
	departmentId: string,
) {
	const databaseUrl = getDatabaseUrl();

	if (!databaseUrl) {
		return { facultyId: null, departmentId: null };
	}

	const database = drizzle(databaseUrl, { schema });
	const [department] = await database
		.select({
			id: schema.departments.id,
			facultyId: schema.departments.facultyId,
		})
		.from(schema.departments)
		.where(
			and(
				eq(schema.departments.id, departmentId),
				eq(schema.departments.facultyId, facultyId),
			),
		)
		.limit(1);

	if (!department) {
		throw new InvalidOrganizationSelectionError(
			"Select a department that belongs to the selected faculty.",
		);
	}

	return {
		departmentId: department.id as EntityId,
		facultyId: department.facultyId as EntityId,
	};
}

class InvalidOrganizationSelectionError extends Error {}

function roleForSignUp(kind: StaffSignUpInput["kind"]): RoleKey {
	return kind === "lecturer" ? "lecturer" : "iptto_officer";
}
