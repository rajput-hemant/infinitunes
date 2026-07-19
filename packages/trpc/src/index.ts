// This entry point is server-only. Import from '@infinitunes/trpc/types'
// for AppRouter type in client components.
import "server-only";

export { appRouter, type AppRouter } from "./root";

import { appRouter } from "./root";
import { createCallerFactory } from "./trpc";

export const createCaller = createCallerFactory(appRouter);
