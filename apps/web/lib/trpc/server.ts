// oxlint-disable-next-line import/no-unassigned-import -- server-only guard is a side-effect import
import "server-only";
import { db } from "@infinitunes/db";
import { createCaller } from "@infinitunes/trpc";

import { getSession, requestEmailChange } from "~/lib/auth";
import { cachedApi } from "~/lib/cached-api";

// Context members are request-safe singletons or thunks (getSession is per-request cache()d).
export const api = createCaller({
  db,
  session: getSession,
  catalogApi: cachedApi,
  requestEmailChange,
});
