import { createClient } from "@infinitunes/db/client";

import { env } from "@/lib/env";

export const db = createClient(env.DATABASE_URL);
