import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "../env.mjs";
import * as schema from "./schema";

const client = postgres(env.DATABASE_URL);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const db = drizzle(client, { schema });
