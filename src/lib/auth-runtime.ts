import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { memoryAdapter } from "better-auth/adapters/memory";
import { username } from "better-auth/plugins/username";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { drizzle } from "drizzle-orm/node-postgres";

import { getDatabaseUrl } from "#/db/env.ts";
import * as schema from "#/db/schema.ts";

const databaseUrl = getDatabaseUrl();
const authSchema = {
	...schema,
	account: schema.authAccount,
	session: schema.authSession,
	user: schema.authUser,
	verification: schema.authVerification,
};

const database = databaseUrl
	? drizzleAdapter(drizzle(databaseUrl, { schema }), {
			provider: "pg",
			schema: authSchema,
		})
	: memoryAdapter({});

export const auth = betterAuth({
	baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
	database,
	emailAndPassword: {
		disableSignUp: false,
		enabled: true,
		maxPasswordLength: 128,
		minPasswordLength: 8,
	},
	secret:
		process.env.BETTER_AUTH_SECRET ??
		"development-only-replace-with-BETTER_AUTH_SECRET",
	trustedOrigins: (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "")
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean),
	plugins: [
		username({
			maxUsernameLength: 64,
			minUsernameLength: 2,
			usernameNormalization: (value) => value.trim().toLowerCase(),
			usernameValidator: (value) => /^[a-z0-9/_-]+$/i.test(value),
		}),
		tanstackStartCookies(),
	],
	account: {
		modelName: "authAccount",
	},
	session: {
		modelName: "authSession",
	},
	user: {
		modelName: "authUser",
	},
	verification: {
		modelName: "authVerification",
	},
});
