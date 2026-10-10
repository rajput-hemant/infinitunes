// oxlint-disable-next-line import/no-unassigned-import -- server-only guard is a side-effect import
import "server-only";
import { db } from "@infinitunes/db";
import { createCaller } from "@infinitunes/trpc";
import { cache } from "react";

import { getSession } from "~/lib/auth";
import { cachedApi } from "~/lib/cached-api";

const createTRPCContext = cache(() => {
  return { db, session: getSession, catalogApi: cachedApi };
});

const getContext = () => createTRPCContext();

export const api = createCaller(getContext());
