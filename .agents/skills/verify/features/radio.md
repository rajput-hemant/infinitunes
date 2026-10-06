# Radio

**Status: LIVE PROOF (partial).** Featured station playback, song/artist row radio, artist details-header radio (fixed in ISSUE-022), manual queue clearing, and mobile rendering confirmed in browser runs `browser-radio-3151` and `infinitunes-radio-auth-fixes` (2026-10-02). Queue refill retained as gap pending playable audio.
Issues: [ISSUE-003](../../../../docs/archive/verification-issues.md#issue-003), [ISSUE-022 (closed)](../../../../docs/archive/verification-issues.md#issue-022). Reference & API notes: [radio-research.md](../../../../docs/research/radio-research.md).

Last live proof: 2026-10-02, runs `browser-radio-3151` and `infinitunes-radio-auth-fixes` (evidence kept outside the repo).

Radio functionality replicates official JioSaavn web client semantics (`webradio.*` API), including featured stations, artist-seeded radio sessions, and continuous queue refills.

## Sub-features

- **Featured Stations Directory**: `/radio` displays featured radio stations fetched from `webradio.getFeaturedStations`.
- **Station Detail Page**: `/radio/[name]/[token]` loads station metadata and initial batch of station tracks via `api.radio.stationDetails`.
- **Featured Station Playback**: Clicking the play button on station cards or the station detail header creates/resolves a station session (`api.radio.createStation({ type: "featured", ... })`), populates the player queue, and starts playback.
- **Song & Artist Radio**: Selecting `Play Radio` from song action menus (`components/song-list/more-button.tsx`) or artist headers (`components/details-header/more-button.tsx`) spawns an artist-seeded radio session via `api.radio.createStation({ type: "artist", artistId, ... })`.
- **Endless Queue Refill**: `apps/web/components/player.tsx` monitors active radio sessions stored in `activeRadioSessionAtom`. When playback reaches the end of the queue (current track within the last 3 queue entries, `currentIndex >= queue.length - 3`), it asynchronously requests the next batch of 10 songs via `utils.radio.songs.fetch({ stationId, k: 10 })` and appends them seamlessly.
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
  - Rolling pagination/refill (`k: 10`).
  - Synthetic station metadata and token decoding.
- Type check: `bun run type-check` exits 0 across all workspaces.
- Linter: `bun run lint` exits 0 with 0 errors.

## Known gap

- Queue refill (last-3 trigger) is unproven: it needs actual audio playback, and Howler will not advance without a CDN-reachable src under headless Chrome.
