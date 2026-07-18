import { createAuth } from "@infinitunes/auth";
import { toNextJsHandler } from "better-auth/next-js";

import { db } from "@/lib/db";

const auth = createAuth(db);

export const { GET, POST } = toNextJsHandler(auth);
