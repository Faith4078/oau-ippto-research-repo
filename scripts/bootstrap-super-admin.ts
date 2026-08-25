import { randomUUID } from "node:crypto";

import { hashPassword } from "better-auth/crypto";
import { config } from "dotenv";
import { and, eq, isNotNull, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import {
	bootstrapSuperAdministrator,
	parseSuperAdminBootstrapEnvironment,
	type SuperAdminBootstrapGateway,
	type SuperAdminBootstrapInput,
} from "#/application/super-admin-bootstrap.ts";
import * as schema from "#/infrastructure/db/schema.ts";

config({ path: [".env.local", ".env"], quiet: true });

const input = parseSuperAdminBootstrapEnvironment(process.env);
const pool = new Pool({ connectionString: input.databaseUrl });
const database = drizzle(pool, { schema });

const gateway: SuperAdminBootstrapGateway = {
	async inspectProvisioning(account) {
		const authenticationRows = await database
			.select({
				id: schema.authUser.id,
				email: schema.authUser.email,
				username: schema.authUser.username,
			})
			.from(schema.authUser)
			.where(
				or(
					eq(schema.authUser.username, account.staffId),
					eq(schema.authUser.email, account.email),
				),
			);

		const applicationRows = await database
			.select({
				email: schema.users.email,
				id: schema.users.id,
				staffId: schema.users.staffId,
				status: schema.users.status,
			})
			.from(schema.users)
			.where(
				or(
					eq(schema.users.staffId, account.staffId),
					eq(schema.users.email, account.email),
				),
			);

		if (authenticationRows.length === 0 && applicationRows.length === 0) {
			return "missing";
		}

		const authentication = authenticationRows[0];
		const application = applicationRows[0];
		if (
			authenticationRows.length !== 1 ||
			applicationRows.length !== 1 ||
			!authentication ||
			!application ||
			authentication.username !== account.staffId ||
			authentication.email.toLowerCase() !== account.email ||
			application.staffId !== account.staffId ||
			application.email.toLowerCase() !== account.email ||
			application.status !== "active"
		) {
			return "conflict";
		}

		const [credentials, assignedRoles, bootstrapEvents] = await Promise.all([
			database
				.select({ id: schema.authAccount.id })
				.from(schema.authAccount)
				.where(
					and(
						eq(schema.authAccount.userId, authentication.id),
						eq(schema.authAccount.providerId, "credential"),
						isNotNull(schema.authAccount.password),
					),
				),
			database
				.select({ key: schema.roles.key })
				.from(schema.userRoles)
				.innerJoin(schema.roles, eq(schema.roles.id, schema.userRoles.roleId))
				.where(eq(schema.userRoles.userId, application.id)),
			database
				.select({ id: schema.auditLogs.id })
				.from(schema.auditLogs)
				.where(
					and(
						eq(schema.auditLogs.action, "super_administrator.bootstrap"),
						eq(schema.auditLogs.targetId, application.id),
					),
				)
				.limit(1),
		]);

		return credentials.length === 1 &&
			assignedRoles.length === 1 &&
			assignedRoles[0]?.key === "super_administrator" &&
			bootstrapEvents.length === 1
			? "existing"
			: "conflict";
	},

	async createSuperAdministrator(account) {
		await createSuperAdministrator(account);
	},
};

try {
	const result = await bootstrapSuperAdministrator(input, gateway);
	process.stdout.write(
		[
			"Super administrator provisioning complete.",
			`Authentication account: ${result.authentication}.`,
			`OAU authorization: ${result.authorization}.`,
			`Sign in with Staff ID ${input.staffId.toUpperCase()}.`,
		].join("\n") + "\n",
	);
} catch (error) {
	const message = error instanceof Error ? error.message : "Provisioning failed.";
	process.stderr.write(`Super administrator provisioning failed: ${message}\n`);
	process.exitCode = 1;
} finally {
	await pool.end();
}

async function createSuperAdministrator(account: SuperAdminBootstrapInput) {
	const password = await hashPassword(account.password);
	const authenticationUserId = randomUUID();
	const applicationUserId = randomUUID();

	await database.transaction(async (transaction) => {
		await transaction.insert(schema.authUser).values({
			displayUsername: account.staffId.toUpperCase(),
			email: account.email,
			emailVerified: true,
			id: authenticationUserId,
			name: account.name,
			username: account.staffId,
		});

		await transaction.insert(schema.authAccount).values({
			accountId: authenticationUserId,
			id: randomUUID(),
			password,
			providerId: "credential",
			userId: authenticationUserId,
		});

		const [user] = await transaction
			.insert(schema.users)
			.values({
				email: account.email,
				emailVerified: true,
				id: applicationUserId,
				name: account.name,
				staffId: account.staffId,
				status: "active",
			})
			.returning({ id: schema.users.id });

		if (!user) {
			throw new Error("The OAU super administrator account could not be saved.");
		}

		await transaction.insert(schema.userProfiles).values({
			recoveryEmail: account.email,
			userId: user.id,
		});

		const [role] = await transaction
			.insert(schema.roles)
			.values({
				description: "Full platform administration access.",
				isSystem: true,
				key: "super_administrator",
				name: "Super Administrator",
			})
			.onConflictDoUpdate({
				set: {
					description: "Full platform administration access.",
					isSystem: true,
					name: "Super Administrator",
					updatedAt: new Date(),
				},
				target: schema.roles.key,
			})
			.returning({ id: schema.roles.id });

		if (!role) {
			throw new Error("The super administrator role could not be prepared.");
		}

		await transaction.insert(schema.userRoles).values({
			roleId: role.id,
			userId: user.id,
		});

		await transaction.insert(schema.auditLogs).values({
			action: "super_administrator.bootstrap",
			actorId: null,
			metadata: {
				provisioningMethod: "trusted_cli",
				staffId: account.staffId,
			},
			targetId: user.id,
			targetType: "user",
			userAgent: "scripts/bootstrap-super-admin.ts",
		});
	});
}
