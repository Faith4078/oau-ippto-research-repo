import { neon } from "@neondatabase/serverless";

import { getDatabaseUrl } from "./db/env.ts";

let client: ReturnType<typeof neon>;

export async function getClient() {
	const databaseUrl = getDatabaseUrl();

	if (!databaseUrl) {
		return undefined;
	}
	if (!client) {
		client = await neon(databaseUrl);
	}
	return client;
}
