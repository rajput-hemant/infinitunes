// This entry point is server-only. Import from '@infinitunes/trpc/types'
// for AppRouter type in client components.
// oxlint-disable-next-line import/no-unassigned-import -- side-effect import intentionally guards against client bundling
import "server-only";
import { appRouter } from "./root";
import { createCallerFactory } from "./trpc";

export { appRouter, type AppRouter } from "./root";

export const createCaller = createCallerFactory(appRouter);
