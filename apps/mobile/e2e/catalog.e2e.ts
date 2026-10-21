/**
 * Every catalog procedure the screens call, through the app's tRPC client,
 * against live upstream, chained the way a listener moves (search result,
 * then its song, album, artist, label...). Checks what the readers rely on;
 * with MOBILE_E2E_DUMP_DIR set it also writes each response there, which
 * `live-screens.test.tsx` then renders every screen with.
 *   MOBILE_E2E_API_URL=http://localhost:3000 MOBILE_E2E_DUMP_DIR=/tmp/live bun run test:e2e
 */
import { describe, expect, setDefaultTimeout, test } from "bun:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { installNativeStubs } from "./native-stubs";

installNativeStubs();
setDefaultTimeout(120_000);

const { trpcClient: t } = await import("../src/lib/trpc");
const { stationRef } = await import("../src/navigation/entity-href");
const { getDownloadLink, getSearchItems, maxQualityOf, parseToken } =
  await import("@infinitunes/types");

const DIR = process.env.MOBILE_E2E_DUMP_DIR;

function dump<T>(name: string, value: T): T {
  if (DIR) {
    mkdirSync(DIR, { recursive: true });
    writeFileSync(join(DIR, `${name}.json`), JSON.stringify(value, null, 2));
  }
  return value;
}

/**
 * Songs reach the player with the decrypted five-bitrate ladder; podcast
 * episodes hosted off JioSaavn's CDN with their one file.
 */
function expectPlayable(
  items: readonly { download_url?: string }[],
  links = 5,
) {
  expect(items.length).toBeGreaterThan(0);
  for (const item of items) {
    const ladder = item.download_url?.split(",") ?? [];
    expect(ladder.length).toBe(links);
    for (const link of ladder) expect(link).toStartWith("https://");
  }
}

// A production run spends the sign-in and request budgets these need.
describe.skipIf(
  !process.env.MOBILE_E2E_API_URL || Boolean(process.env.MOBILE_E2E_PRODUCTION),
)("live catalog", () => {
  test("browse lists", async () => {
    const home = dump("home.home", await t.home.home.query({}));
    expect(home.new_trending?.length).toBeGreaterThan(0);
    dump("search.top", await t.search.top.query());
    for (const type of ["song", "album", "playlist"] as const) {
      dump(`get.trending.${type}`, await t.get.trending.query({ type }));
    }
    const paged = { page: 1, n: 20 };
    expect(
      dump("get.charts", await t.get.charts.query(paged)).length,
    ).toBeGreaterThan(0);
    dump("get.featuredPlaylists", await t.get.featuredPlaylists.query(paged));
    dump("get.featuredStations", await t.get.featuredStations.query(paged));
    dump("get.topArtists", await t.get.topArtists.query(paged));
    dump("get.topAlbums", await t.get.topAlbums.query(paged));
    dump("get.topShows", await t.get.topShows.query(paged));
  });

  test("search, and every entity a result leads to", async () => {
    const all = dump("search.all", await t.search.all.query({ q: "arijit" }));
    if (!all) throw new Error("search.all found nothing");
    // Every group but artists links to its own screen.
    for (const group of ["songs", "albums", "playlists", "shows"] as const) {
      for (const item of getSearchItems(all[group])) {
        expect(item.perma_url).toStartWith("https://www.jiosaavn.com/");
      }
    }
    for (const type of [
      "songs",
      "albums",
      "playlists",
      "artists",
      "podcasts",
    ] as const) {
      const found = dump(
        `search.byType.${type}`,
        await t.search.byType.query({ q: "love", type, page: 1, n: 10 }),
      );
      expect(found.results.length).toBeGreaterThan(0);
    }
    expectPlayable(
      (
        await t.search.byType.query({
          q: "love",
          type: "songs",
          page: 1,
          n: 10,
        })
      ).results as { download_url?: string }[],
    );

    const songItem = getSearchItems(all.songs)[0];
    const song = dump(
      "song.details",
      await t.song.details.query({
        token: parseToken(songItem?.perma_url ?? ""),
      }),
    ).songs[0];
    if (!song) throw new Error("no song");
    expectPlayable([song]);
    // The link the player picks answers as audio (the CDN 404s a bad suffix).
    const link = getDownloadLink(
      song.download_url ?? "",
      "excellent",
      maxQualityOf(song.more_info),
    );
    const media = await fetch(link, { headers: { range: "bytes=0-1" } });
    expect([media.status, media.headers.get("content-type")]).toEqual([
      206,
      "audio/mp4",
    ]);
    dump(
      "song.recommendations",
      await t.song.recommendations.query({ id: song.id }),
    );
    dump("song.items", await t.song.items.query({ id: song.id }));
    dump("get.lyrics", await t.get.lyrics.query({ id: song.id }));
    const artistIds = song.more_info.artistMap.primary_artists
      .map((a) => a.id)
      .join(",");
    const bySong = { song_id: song.id, lang: song.language };
    expectPlayable(
      dump(
        "artist.topSongs",
        await t.artist.topSongs.query({ artist_id: artistIds, ...bySong }),
      ),
    );
    dump(
      "get.actorTopSongs",
      await t.get.actorTopSongs.query({ actor_id: artistIds, ...bySong }),
    );

    const albumItem = getSearchItems(all.albums)[0];
    const album = dump(
      "album.details",
      await t.album.details.query({
        token: parseToken(albumItem?.perma_url ?? ""),
      }),
    );
    expectPlayable(Array.isArray(album.list) ? album.list : []);
    dump(
      "album.recommendations",
      await t.album.recommendations.query({ id: album.id }),
    );
    dump(
      "album.sameYear",
      await t.album.sameYear.query({ year: `${album.year}` }),
    );

    const artistUrl =
      song.more_info.artistMap.primary_artists[0]?.perma_url ?? "";
    const artist = dump(
      "artist.details",
      await t.artist.details.query({ token: parseToken(artistUrl) }),
    );
    for (const release of [
      ...(artist.singles ?? []),
      ...(artist.latest_release ?? []),
    ]) {
      expect(release.type).toBe("album");
    }
    const songsPage = dump(
      "artist.songs",
      await t.artist.songs.query({ id: artist.artistId, page: 0 }),
    );
    expect(songsPage).toHaveProperty("topSongs.songs");
    const albumsPage = dump(
      "artist.albums",
      await t.artist.albums.query({ id: artist.artistId, page: 0 }),
    );
    expect(albumsPage).toHaveProperty("topAlbums.albums");

    const playlistItem = getSearchItems(all.playlists)[0];
    const playlist = dump(
      "playlist.details",
      await t.playlist.details.query({
        token: parseToken(playlistItem?.perma_url ?? ""),
      }),
    );
    expectPlayable(Array.isArray(playlist.list) ? playlist.list : []);
    dump(
      "playlist.recommendations",
      await t.playlist.recommendations.query({ id: playlist.id }),
    );

    const labelUrl = song.more_info.label_url;
    if (labelUrl) {
      const label = dump(
        "get.label",
        await t.get.label.query({
          token: parseToken(labelUrl),
          page: 0,
          n_song: 10,
          n_album: 10,
        }),
      );
      expect(label.name).toBeTruthy();
    }
  });

  test("podcasts: show, its episodes, one episode", async () => {
    const shows = await t.get.topShows.query({ page: 1, n: 20 });
    const show = dump(
      "show.details",
      await t.show.details.query({
        token: parseToken(shows.data[0]?.perma_url ?? ""),
      }),
    );
    const episodes = dump(
      "show.episodes",
      await t.show.episodes.query({ id: show.show_details.id, page: 1 }),
    );
    expectPlayable(episodes, 1);
    const episode = dump(
      "show.episodeDetails",
      await t.show.episodeDetails.query({
        token: parseToken(episodes[0]?.perma_url ?? ""),
      }),
    );
    expectPlayable(episode.episodes, 1);
  });

  test("radio: a featured and an artist station", async () => {
    const [station] = await t.get.featuredStations.query({ page: 1, n: 20 });
    const ref = station && stationRef(station.perma_url);
    if (!station || !ref) throw new Error("no featured station");
    dump(
      "radio.stationDetails",
      // What the station route opens with (`/radio/<name>/<token>`).
      await t.radio.stationDetails.query(ref),
    );
    const featured = await t.radio.createStation.mutate({
      type: "featured",
      name: station.title,
      language: station.more_info.language,
    });
    expect(featured.stationId).toBeTruthy();
    // Upstream answers "No new song found" outside India: songs may be [].
    dump(
      "radio.songs",
      await t.radio.songs.query({ stationId: featured.stationId, k: 5 }),
    );
  });
});
