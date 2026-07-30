import { drizzle } from "drizzle-orm/node-postgres";

import { requireDatabaseUrl } from "./env.ts";
import * as schema from "./schema.ts";

export const db = drizzle(requireDatabaseUrl(), { schema });
