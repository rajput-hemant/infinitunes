import "server-only";
import { db } from "@infinitunes/db";
import { createCaller, type AppRouter } from "@infinitunes/trpc";
import { cache } from "react";

import { getSession } from "~/lib/auth";

const createTRPCContext = cache(() => {
  return { db, session: getSession };
});

const getContext = () => createTRPCContext();

export const api = createCaller(getContext());
