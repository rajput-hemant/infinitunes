# Player, queue, download

**DRAFT. Last live proof: none.** Issues: ISSUE-003, ISSUE-016 in [verification-issues.md](../../../../docs/verification/verification-issues.md).

## Sub-features

- Play from cards, song lists and details headers (`components/play-button.tsx`, `song-list/play-pause-button.tsx`); `radio_station` and episode cards also play from there.
- Player bar (`components/player.tsx`): `Previous`, play/pause, `Next`, seek, `Volume`.
- Queue sheet (`components/queue.tsx`): list, remove item (toast `Removed from queue`).
- Persistence in localStorage: `queue`, `current_song_index`, `stream_quality`, `download_quality`, `image_quality` (`apps/web/hooks/use-store.ts`).
- Add to queue from the song menu: toast `"<name>" added to queue`.
- Download (`components/download-button.tsx`): honors `download_quality`; toast `Downloaded <name>`.
- Needs `JIOSAAVN_DES_KEY` to decrypt media URLs.

## How to get to it (user POV)

Any song row or card play button; queue icon in the player bar.

## Driving it with browser skill (pending)

1. Open an album page, click `Play`; expect the player bar to appear with title and a playing state (audio element progressing).
2. Click `Next` then `Previous`; expect the current song and `current_song_index` to change.
3. Open the queue sheet; remove one item; expect the toast and one fewer row. (Prior run did not prove removal.)
4. Reload; expect the queue and index restored from localStorage.
5. Download a song at the default quality; expect the download toast and a saved file. Remove the file afterwards.
6. Change stream quality in preferences and replay; expect the request to use the new bitrate.

Observable end state: audio element advances, queue state persists across reload, download toast and file appear.

## Gotchas

- Autoplay policies may require a real click gesture first.
- Playback depends on upstream CDN availability; a failure is not necessarily an app bug.
- Unit tests (`apps/web/tests/dom/queue-sheet.test.tsx`, `packages/trpc/tests/download-url.test.ts`) do not play audio.
