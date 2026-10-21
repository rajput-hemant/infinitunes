import { useEffect, useRef } from "react";

import { authClient } from "~/lib/auth-client";

import { shareAssistantPlaylists } from "./assistant-shortcuts";
import { useServerPlaylists } from "./playlists";

/**
 * Keeps the voice assistant's copy of the listener's playlists (names and
 * ids, `shareAssistantPlaylists`) in step with the server's: every load and
 * write refreshes it, and signing out clears it. A cold start waits for the
 * stored session, so it never clears the list of someone who is signed in;
 * switching accounts clears the previous one's until the new list loads.
 * Mounted once at the root.
 */
export function AssistantPlaylists() {
  const { data: session, isPending } = authClient.useSession();
  const userId = session?.user.id;
  const { data: playlists } = useServerPlaylists();
  const sharedFor = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (isPending) return;
    if (!userId) shareAssistantPlaylists(null);
    else if (playlists) {
      shareAssistantPlaylists(playlists.map(({ id, name }) => ({ id, name })));
    } else if (sharedFor.current && sharedFor.current !== userId) {
      shareAssistantPlaylists(null);
    } else return;
    sharedFor.current = userId;
  }, [isPending, userId, playlists]);

  return null;
}
