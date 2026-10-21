import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { authClient } from "~/lib/auth-client";

type SessionUser = NonNullable<
  ReturnType<typeof authClient.useSession>["data"]
>["user"];

/**
 * The account screens' guard: the signed-in user is passed to `children`.
 * A guest goes to the settings list. One whose account goes away while the
 * screen is open (signed out, deleted) pops back to the list already in the
 * stack, rather than stacking a second one on top; a link that opens the
 * screen as a guest redirects, as the imperative router is not ready yet.
 */
export function RequireSession({
  children,
}: {
  children: (user: SessionUser) => ReactNode;
}) {
  const { data: session, isPending } = authClient.useSession();
  const guest = !isPending && !session;
  const [openedAsGuest] = useState(guest);

  useEffect(() => {
    if (guest && !openedAsGuest) router.dismissTo("/settings");
  }, [guest, openedAsGuest]);

  if (guest && openedAsGuest) return <Redirect href="/settings" />;
  if (!session) return null;
  return children(session.user);
}
