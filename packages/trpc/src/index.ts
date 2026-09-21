// This entry point is server-only. Import from '@infinitunes/trpc/types'
// for AppRouter type in client components.
import "server-only";
import { appRouter } from "./root";
import { createCallerFactory } from "./trpc";

export { appRouter, type AppRouter } from "./root";

export const createCaller = createCallerFactory(appRouter);
