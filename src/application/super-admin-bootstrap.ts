import { z } from "zod";

import { normalizeStaffId } from "#/lib/auth.ts";

const environmentSchema = z.object({
	DATABASE_URL: z.string().trim().min(1, "DATABASE_URL is required."),
	SUPER_ADMIN_EMAIL: z.email(
		"SUPER_ADMIN_EMAIL must be a valid email address.",
	),
	SUPER_ADMIN_NAME: z
		.string()
		.trim()
		.min(2, "SUPER_ADMIN_NAME must contain at least 2 characters."),
	SUPER_ADMIN_PASSWORD: z
		.string()
		.min(15, "SUPER_ADMIN_PASSWORD must contain at least 15 characters.")
		.max(128, "SUPER_ADMIN_PASSWORD cannot exceed 128 characters."),
	SUPER_ADMIN_STAFF_ID: z
		.string()
		.trim()
		.regex(
			/^AT\/\d{4}$/i,
			"SUPER_ADMIN_STAFF_ID must use AT/ followed by exactly 4 digits.",
		),
});

export type SuperAdminBootstrapInput = {
	databaseUrl: string;
	email: string;
	name: string;
	password: string;
	staffId: string;
};

export type ProvisioningState = "missing" | "existing" | "conflict";

export type SuperAdminBootstrapGateway = {
	inspectProvisioning(
		input: SuperAdminBootstrapInput,
	): Promise<ProvisioningState>;
	createSuperAdministrator(input: SuperAdminBootstrapInput): Promise<void>;
};

export function parseSuperAdminBootstrapEnvironment(
	environment: Record<string, string | undefined>,
): SuperAdminBootstrapInput {
	const parsed = environmentSchema.safeParse(environment);

	if (!parsed.success) {
		const message = parsed.error.issues.map((issue) => issue.message).join(" ");
		throw new Error(message);
	}

	return {
		databaseUrl: parsed.data.DATABASE_URL,
		email: parsed.data.SUPER_ADMIN_EMAIL.trim().toLowerCase(),
		name: parsed.data.SUPER_ADMIN_NAME.trim(),
		password: parsed.data.SUPER_ADMIN_PASSWORD,
		staffId: normalizeStaffId(parsed.data.SUPER_ADMIN_STAFF_ID),
	};
}

export async function bootstrapSuperAdministrator(
	input: SuperAdminBootstrapInput,
	gateway: SuperAdminBootstrapGateway,
) {
	const state = await gateway.inspectProvisioning(input);

	if (state === "conflict") {
		throw new Error(
			"The Staff ID or email is already present but was not created by this trusted bootstrap. No changes were made.",
		);
	}

	if (state === "existing") {
		return { authentication: "existing", authorization: "existing" } as const;
	}

	await gateway.createSuperAdministrator(input);

	return {
		authentication: "created",
		authorization: "created",
	} as const;
}
