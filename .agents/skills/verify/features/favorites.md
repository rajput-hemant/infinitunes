# Favorites (likes)

Last live proof: 2026-10-10, [skill-verify record](../../../../docs/verification/skill-verify-2026-10-10.md). Two songs liked from an album, one `infinitunes_favorite` row, `/me/liked-songs` lists both. Issues: ISSUE-003 in [verification-history.md](../../../../docs/archive/verification-history.md).

## Sub-features

- `Like` button (`components/like-button.tsx`) on detail headers; guests get toast `Unable to perform action. Please sign in.`.
- tRPC `user.addToFavorites`, `removeFromFavorites`, `getUserFavorites` (`packages/trpc/src/router/user.ts`); first favorite is an atomic upsert (`favorites-concurrency.test.ts`).
- Types: song, album, playlist, artist, show; stored as arrays in `infinitunes_favorite`.
- Lists: `/me/liked-songs`, `/me/albums`, `/me/artists`, `/me/shows`.
- The song-row `More Options` menu has `Add To Favourite` / `Remove From Favourite` (`components/song-list/more-button.tsx`), shown for songs only.

## How to get to it (user POV)

Heart button on an album, artist, playlist or show header; library pages under `/me`.

## Driving it with browser skill (pending)

1. As guest click `Like` on an album; expect the sign-in warning toast and no DB row.
2. Sign in, like an album, an artist and a show; expect success toasts and rows/array entries in `infinitunes_favorite`.
3. Open `/me/albums`, `/me/artists`, `/me/shows`; expect each liked item.
4. Unlike; expect removal from the list and the array.
5. Rapidly double-click the first like on a fresh user; expect one row, no duplicate error.

Observable end state: the favorites row and the library pages agree with each action.

## Gotchas

- Song likes go through the row menu item; verify them in `/me/liked-songs`.
- Check per-user isolation by creating two users and confirming neither sees the other's items.
