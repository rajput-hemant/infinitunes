# Radio

**Status: LIVE PROOF (partial).** Featured station playback, song/artist row radio, artist details-header radio (fixed in ISSUE-022), manual queue clearing, and mobile rendering confirmed in browser runs `browser-radio-3151` and `infinitunes-radio-auth-fixes` (2026-10-02). Queue refill retained as gap pending playable audio.
Issues: [ISSUE-003](../../../../docs/checks/verification-issues.md#issue-003), [ISSUE-022 (closed)](../../../../docs/checks/verification-issues.md#issue-022). Reference & API notes: [radio-research.md](../../../../docs/checks/radio-research.md).

Last live proof: 2026-10-02, run `infinitunes-radio-auth-fixes`, port 3152, container `infinitunes-verify-pg-54352`. Evidence: `/Users/rajput-hemant/Desktop/firstmate/data/infinitunes-radio-auth-fixes/evidence/`. Prior evidence: `/Users/rajput-hemant/Desktop/firstmate/data/infinitunes-radio/evidence/`.

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

## Browser proof (run browser-radio-3151, 2026-10-02)

Evidence screenshots in `/Users/rajput-hemant/Desktop/firstmate/data/infinitunes-radio/evidence/`.

| Feature                              | Result  | Screenshot                                  | Notes                                                                                                                                                       |
| ------------------------------------ | ------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/radio` featured stations grid      | ✅ PASS | `02-radio-browse.png`                       | Real station names, artwork, correct URLs                                                                                                                   |
| Station detail page                  | ✅ PASS | `03-station-detail.png`                     | 20 songs, heading, Play button                                                                                                                              |
| Featured station playback            | ✅ PASS | `04-radio-playing.png`                      | `activeRadio` set, 20 songs in queue, player badge                                                                                                          |
| Song row "Play Radio" (artist radio) | ✅ PASS | `05-song-artist-radio.png`                  | `stationId` contains `~^~artist_radio~^~461968`, 20 songs                                                                                                   |
| Manual queue replaces radio session  | ✅ PASS | `06-manual-queue-cleared-radio.png`         | `activeRadio = null` when Play clicked on artist page                                                                                                       |
| Mobile `/radio` (390×844)            | ✅ PASS | `07-radio-mobile-390px.png`                 | Station grid renders at mobile width                                                                                                                        |
| Artist details-header "Play Radio"   | ✅ PASS | `06-verified-artist-play-radio-success.png` | `artistId` passed from `DetailsHeader`; station created with `...~^~artist_radio~^~459320`; 20 songs added to queue; `activeRadio` set. Fixed in ISSUE-022. |
| Queue refill (last-3 trigger)        | ⚠️ GAP  | —                                           | Requires actual audio playback; Howler won't advance without CDN-reachable src under headless Chrome. (Retained gap)                                        |
