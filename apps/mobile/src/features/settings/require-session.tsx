import { Redirect } from "expo-router";
import type { ReactNode } from "react";

import { authClient } from "~/lib/auth-client";

type SessionUser = NonNullable<
  ReturnType<typeof authClient.useSession>["data"]
>["user"];

/**
 * The account screens' guard: the signed-in user is passed to `children`,
 * and a guest, or an account that was just deleted or signed out, goes back
 * to the settings list.
 */
export function RequireSession({
  children,
}: {
  children: (user: SessionUser) => ReactNode;
}) {
  const { data: session, isPending } = authClient.useSession();
  if (isPending) return null;
  if (!session) return <Redirect href="/settings" />;
  return children(session.user);
}
