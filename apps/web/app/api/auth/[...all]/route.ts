import { createAuth } from "@infinitunes/auth";
import { db } from "@infinitunes/db/db";
import { toNextJsHandler } from "better-auth/next-js";

const auth = createAuth(db);

export const { GET, POST } = toNextJsHandler(auth);
