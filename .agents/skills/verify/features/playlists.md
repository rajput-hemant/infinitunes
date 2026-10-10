# User playlists

**DRAFT. Last live proof: none.** Issues: ISSUE-003, ISSUE-016 in [verification-history.md](../../../../docs/archive/verification-history.md).

## Sub-features

- Create (`components/playlist/new-playlist-form.tsx`, placeholders `Enter playlist name`, `Enter playlist description`); cap of 10 playlists per user (error `You can only have 10 playlists, please delete one`).
- Add songs (`add-to-playlist-dialog.tsx`, song menu `Add To Playlist`), remove (`Remove from Playlist`), rename (`rename-playlist-dialog.tsx`), delete (`PlaylistManageMenu`, label `Playlist options`).
- Pages `/me/playlists` and `/me/playlist/[id]`; the sidebar lists user playlists.
- tRPC procedures in `user.ts`: `getUserPlaylists`, `getPlaylistDetails`, `addSongsToPlaylist`, `removeSongsFromPlaylist`, `renamePlaylist`, `deletePlaylist`, `createNewPlaylist`; cache tag `user_playlists`.

## How to get to it (user POV)

User dropdown or sidebar to `/me/playlists`; `More Options` on a song row.

## Driving it with browser skill (pending)

1. Signed in, create a playlist; verify the `infinitunes_playlist` row (prior run verified creation only).
2. From an album song row `More Options` then `Add To Playlist`; pick the playlist; expect a toast and the song id in `songs`. (Not proven before.)
3. Open `/me/playlist/<id>`; expect the song; remove it; expect removal and DB array update.
4. Rename then delete; expect list and sidebar refresh via cache tag.
5. Create 11 playlists; expect the 11th to be rejected with the cap message. As a second user, request the first user's playlist id; expect no access.

Observable end state: rows match UI; ownership checks hold.

## Gotchas

- Songs are stored as plain token strings; a stale token renders the generic error page.
- Mutations run through server actions in `apps/web/lib/actions.ts` then tRPC.
