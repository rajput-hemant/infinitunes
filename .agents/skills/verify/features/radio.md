# Radio

**DRAFT - not live-verified (non-browser tests passing; browser proof pending chosen skill).**
Issues: [ISSUE-003](../../../../docs/checks/verification-issues.md#issue-003). Reference & API notes: [radio-research.md](../../../../docs/checks/radio-research.md).

Radio functionality replicates official JioSaavn web client semantics (`webradio.*` API), including featured stations, artist-seeded radio sessions, and continuous queue refills.

## Sub-features

- **Featured Stations Directory**: `/radio` displays featured radio stations fetched from `webradio.getFeaturedStations`.
- **Station Detail Page**: `/radio/[name]/[token]` loads station metadata and initial batch of station tracks via `api.radio.stationDetails`.
- **Featured Station Playback**: Clicking the play button on station cards or the station detail header creates/resolves a station session (`api.radio.createStation({ type: "featured", ... })`), populates the player queue, and starts playback.
- **Song & Artist Radio**: Selecting `Play Radio` from song action menus (`components/song-list/more-button.tsx`) or artist headers (`components/details-header/more-button.tsx`) spawns an artist-seeded radio session via `api.radio.createStation({ type: "artist", artistId, ... })`.
- **Endless Queue Refill**: `apps/web/components/player.tsx` monitors active radio sessions stored in `activeRadioSessionAtom`. When playback reaches the end of the queue ($\le 2$ tracks remaining), it asynchronously requests the next batch of 5 songs via `api.radio.songs({ stationId, next: 1 })` and appends them seamlessly.
- **Player State & Badge**: The player bar displays a live "Radio" badge alongside track details when a radio session is active.

## How to get to it (user POV)

- Sidebar -> `Radio` -> Browse featured stations.
- Click play icon on any featured station card.
- Or open station page `/radio/<name>/<token>` and click Play.
- Or open an artist/song menu -> `More Options` -> `Play Radio`.

## Non-browser verification evidence

- Test suite: `packages/trpc/tests/radio-router.test.ts` (9 tests passing).
  - Featured stations retrieval and mapping.
  - Featured station session creation and song fetching.
  - Artist radio session creation (`...~^~artist_radio~^~<id>`).
  - Fallback entity station creation.
  - Upstream error handling and graceful fallbacks.
  - Song payload decryption and `withDownloadUrl` pipeline.
  - Rolling pagination/refill (`next: 1`, `count: 5`).
  - Synthetic station metadata and token decoding.
- Type check: `bun run type-check` exits 0 across all workspaces.
- Linter: `bun run lint` exits 0 with 0 errors.

## Driving it with browser skill (pending)

1. Open `/radio`; expect featured stations grid/slider loaded.
2. Click play on a featured station card; expect player to activate with "Radio" badge and audio playback to begin.
3. Open a song menu on any album/playlist and click `Play Radio`; expect player queue to switch to radio mode seeded by artist.
4. Advance playback or seek near the end of the current queue; expect new songs to automatically append to the queue without playback interruption.

Observable end state: audio plays continuously with dynamic refills as user listens. Browser E2E proof remains DRAFT pending chosen browser skill.
