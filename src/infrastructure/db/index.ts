import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema.ts";

export type Database = ReturnType<typeof createDatabase>;

export function createDatabase(databaseUrl: string) {
	return drizzle(databaseUrl, { schema });
}

export { schema };
