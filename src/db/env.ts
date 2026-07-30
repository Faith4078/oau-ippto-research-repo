export function getDatabaseUrl(): string | undefined {
	return process.env.DATABASE_URL;
}

export function requireDatabaseUrl(): string {
	const databaseUrl = getDatabaseUrl();

	if (!databaseUrl) {
		throw new Error("DATABASE_URL is required for database access.");
	}

	return databaseUrl;
}
