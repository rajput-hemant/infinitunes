import { createCaller, type AppRouter } from "@infinitunes/trpc";
import { cache } from "react";

const createTRPCContext = cache(async () => {
  return {};
});

const getContext = () => createTRPCContext();

export const api = createCaller(getContext());
