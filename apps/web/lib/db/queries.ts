// oxlint-disable-next-line import/no-unassigned-import -- server-only guard is a side-effect import
import "server-only";
import { cache } from "react";

import { api } from "~/lib/trpc/server";

/**
 * The signed-in visitor's library reads. Plain server functions, not server
 * actions: a `"use server"` export is a public POST endpoint and runs once per
 * call, while these are memoized per request (with `getViewer()`, which reads
 * the same data) and only ever called from server components. They read the
 * session cookie, so they are request-time and never inside a `"use cache"`
 * scope. Mutations live in `~/lib/actions`.
 */
export const getUserPlaylists = cache(async () => {
  return await api.user.getUserPlaylists();
});

export const getPlaylistDetails = cache(async (playlistId: string) => {
  return await api.user.getPlaylistDetails({ playlistId });
});

export const getUserFavorites = cache(async () => {
  return await api.user.getUserFavorites();
});
