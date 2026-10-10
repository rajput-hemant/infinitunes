import type { Auth } from "@infinitunes/auth";
import type { DbClient } from "@infinitunes/db/client";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

import { api } from "./lib/api";

type AuthSession = NonNullable<Awaited<ReturnType<Auth["api"]["getSession"]>>>;

export type Session = {
  user: Pick<AuthSession["user"], "id">;
  /**
   * Current session's token (so password changes can keep it and revoke the
   * rest) and creation time (fresh-session checks for passwordless accounts).
   */
  session?: Partial<Pick<AuthSession["session"], "token" | "createdAt">>;
} | null;

export type TRPCContext = {
  db: DbClient;
  catalogApi?: typeof api;
  /**
   * A loaded session, or a thunk. The RSC caller passes `getSession` so
   * public procedures skip the lookup; the HTTP adapter passes the value.
   * `protectedProcedure` resolves either form.
   */
  session: Session | (() => Promise<Session>);
};

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

async function resolveSession(
  session: TRPCContext["session"],
): Promise<Session> {
  return typeof session === "function" ? session() : session;
}

export const router = t.router;
export const publicProcedure = t.procedure.use(({ ctx, next }) =>
  next({ ctx: { ...ctx, catalogApi: ctx.catalogApi ?? api } }),
);
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const session = await resolveSession(ctx.session);

  if (!session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
  }

  return next({ ctx: { ...ctx, session } });
});
export const createCallerFactory = t.createCallerFactory;
