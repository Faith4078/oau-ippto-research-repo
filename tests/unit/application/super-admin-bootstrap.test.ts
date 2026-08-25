import { describe, expect, it, vi } from "vitest";

import {
	bootstrapSuperAdministrator,
	parseSuperAdminBootstrapEnvironment,
	type SuperAdminBootstrapGateway,
} from "#/application/super-admin-bootstrap.ts";

const validEnvironment = {
	DATABASE_URL: "postgresql://example.invalid/oau",
	SUPER_ADMIN_EMAIL: "platform.admin@oauife.edu.ng",
	SUPER_ADMIN_NAME: "OAU Platform Administrator",
	SUPER_ADMIN_PASSWORD: "a-long-production-passphrase",
	SUPER_ADMIN_STAFF_ID: "AT/0001",
};

describe("super administrator bootstrap", () => {
	it("accepts a dedicated administrative identity with a long password", () => {
		expect(parseSuperAdminBootstrapEnvironment(validEnvironment)).toEqual({
			databaseUrl: validEnvironment.DATABASE_URL,
			email: validEnvironment.SUPER_ADMIN_EMAIL,
			name: validEnvironment.SUPER_ADMIN_NAME,
			password: validEnvironment.SUPER_ADMIN_PASSWORD,
			staffId: "at/0001",
		});
	});

	it("rejects missing secrets and weak passwords", () => {
		expect(() =>
			parseSuperAdminBootstrapEnvironment({
				...validEnvironment,
				SUPER_ADMIN_PASSWORD: "Pass12!A",
			}),
		).toThrow(/at least 15 characters/i);

		expect(() =>
			parseSuperAdminBootstrapEnvironment({
				...validEnvironment,
				DATABASE_URL: "",
			}),
		).toThrow(/DATABASE_URL/i);
	});

	it("creates authentication and authorization through one trusted operation", async () => {
		const gateway: SuperAdminBootstrapGateway = {
			inspectProvisioning: vi.fn().mockResolvedValue("missing"),
			createSuperAdministrator: vi.fn(),
		};

		const input = parseSuperAdminBootstrapEnvironment(validEnvironment);
		const result = await bootstrapSuperAdministrator(input, gateway);

		expect(gateway.createSuperAdministrator).toHaveBeenCalledOnce();
		expect(result).toEqual({
			authentication: "created",
			authorization: "created",
		});
	});

	it("is safe to rerun for the same account", async () => {
		const gateway: SuperAdminBootstrapGateway = {
			inspectProvisioning: vi.fn().mockResolvedValue("existing"),
			createSuperAdministrator: vi.fn(),
		};

		const result = await bootstrapSuperAdministrator(
			parseSuperAdminBootstrapEnvironment(validEnvironment),
			gateway,
		);

		expect(gateway.createSuperAdministrator).not.toHaveBeenCalled();
		expect(result).toEqual({
			authentication: "existing",
			authorization: "existing",
		});
	});

	it("stops when the Staff ID or email belongs to another auth identity", async () => {
		const gateway: SuperAdminBootstrapGateway = {
			inspectProvisioning: vi.fn().mockResolvedValue("conflict"),
			createSuperAdministrator: vi.fn(),
		};

		await expect(
			bootstrapSuperAdministrator(
				parseSuperAdminBootstrapEnvironment(validEnvironment),
				gateway,
			),
		).rejects.toThrow(/not created by this trusted bootstrap/i);
		expect(gateway.createSuperAdministrator).not.toHaveBeenCalled();
	});
});
