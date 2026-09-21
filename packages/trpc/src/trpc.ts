import type { Auth } from "@infinitunes/auth";
import type { DbClient } from "@infinitunes/db/client";
import { initTRPC } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import superjson from "superjson";

type AuthSession = NonNullable<Awaited<ReturnType<Auth["api"]["getSession"]>>>;

export type Session = { user: Pick<AuthSession["user"], "id"> } | null;

export type TRPCContext = {
  db: DbClient;
  session: Session | (() => Promise<Session>);
};

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const session =
    typeof ctx.session === "function" ? await ctx.session() : ctx.session;

  if (!session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
  }

  return next({ ctx: { ...ctx, session } });
});
export const createCallerFactory = t.createCallerFactory;
