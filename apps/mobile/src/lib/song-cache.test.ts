import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import { Directory, File } from "expo-file-system";

import { putFile, resetFiles } from "~/test/expo-file-system";

import { preferencesStore } from "./preferences";
import {
  cacheBytes,
  cacheQualifiedListen,
  cachedSongSource,
  clearSongCache,
  createCacheListenTracker,
  refreshSongCacheSize,
  SONG_CACHE_LIMIT,
  songCacheStore,
} from "./song-cache";

const track = { ...toSongRow(rawSong()), queueItemId: "first" };
const source = "https://aac.saavncdn.com/598/BSaNI3Yr_320.mp4";
const qualify = async () => {
  await cacheQualifiedListen(track, "excellent");
  await cacheQualifiedListen(track, "excellent");
};
beforeEach(async () => {
  await clearSongCache();
  resetFiles();
  preferencesStore.setState({ cacheFrequentSongs: true });
});

it("counts half a song once per listen, ignores seeking, and counts repeat-one", () => {
  const observe = createCacheListenTracker();
  expect(observe(track, 80, 100, true, false)).toBe(false);
  observe(track, 0, 100, true, false);
  for (let i = 1; i < 50; i++)
    expect(observe(track, i, 100, true, false)).toBe(false);
  expect(observe(track, 50, 100, true, false)).toBe(true);
  expect(observe(track, 51, 100, true, false)).toBe(false);
  observe(track, 100, 100, false, true);
  for (let i = 1; i < 50; i++) observe(track, i, 100, true, false);
  expect(observe(track, 50, 100, true, false)).toBe(true);
});

it("downloads only after two qualified listens and reuses the file", async () => {
  await cacheQualifiedListen(track, "excellent");
  expect(File.downloadFileAsync).not.toHaveBeenCalled();
  await cacheQualifiedListen(track, "excellent");
  expect(File.downloadFileAsync).toHaveBeenCalledTimes(1);
  expect(cacheBytes(songCacheStore.getState().songs)).toBe(1024);
  expect(cachedSongSource(track, source)).toMatch(
    /^file:\/\/\/cache\/frequent-songs\//,
  );
  await cacheQualifiedListen(track, "excellent");
  expect(File.downloadFileAsync).toHaveBeenCalledTimes(1);
});

it("does not cache or select a cache when disabled, or reuse a different quality", async () => {
  await qualify();
  expect(
    cachedSongSource(track, source.replace("_320", "_96")),
  ).toBeUndefined();
  preferencesStore.setState({ cacheFrequentSongs: false });
  expect(cachedSongSource(track, source)).toBeUndefined();
  await cacheQualifiedListen({ ...track, id: "other" }, "excellent");
  expect(File.downloadFileAsync).toHaveBeenCalledTimes(1);
});

it("uses the stream bitrate ladder when a download fails", async () => {
  jest.mocked(File.downloadFileAsync).mockRejectedValueOnce(new Error("404"));
  await qualify();
  expect(File.downloadFileAsync).toHaveBeenNthCalledWith(
    2,
    source.replace("_320", "_160"),
    expect.anything(),
    { idempotent: true },
  );
  expect(Object.values(songCacheStore.getState().songs)[0]?.source).toBe(
    source.replace("_320", "_160"),
  );
  expect(cachedSongSource(track, source)).toMatch(/^file:/);
});

it("evicts the least recently played files and accounts for OS purges", async () => {
  const size = SONG_CACHE_LIMIT / 2;
  const songs = {
    old: { filename: "old.mp4", source: "old", size, lastPlayed: 1 },
    recent: { filename: "recent.mp4", source: "recent", size, lastPlayed: 2 },
  };
  for (const song of Object.values(songs))
    putFile("file:///cache/frequent-songs/" + song.filename, size);
  songCacheStore.setState({ songs });
  await qualify();
  expect(songCacheStore.getState().songs.old).toBeUndefined();
  expect(songCacheStore.getState().songs.recent).toBeDefined();
  expect(cacheBytes(songCacheStore.getState().songs)).toBeLessThanOrEqual(
    SONG_CACHE_LIMIT,
  );
  new File("file:///cache/frequent-songs/recent.mp4").delete();
  await refreshSongCacheSize();
  expect(cacheBytes(songCacheStore.getState().songs)).toBe(1024);
});

it("rejects an oversized download without evicting existing songs", async () => {
  jest
    .mocked(File.downloadFileAsync)
    .mockImplementationOnce(async (_url, file) => {
      const target = new File(file.uri);
      putFile(target.uri, SONG_CACHE_LIMIT + 1);
      return target;
    });
  await qualify();
  expect(cacheBytes(songCacheStore.getState().songs)).toBe(0);
});

it("removes missing files and clears only the dedicated cache, including orphan files", async () => {
  await qualify();
  const uri = cachedSongSource(track, source)!;
  new File(uri).delete();
  expect(cachedSongSource(track, source)).toBeUndefined();
  expect(cacheBytes(songCacheStore.getState().songs)).toBe(0);
  putFile("file:///cache/frequent-songs/interrupted.mp4", 2048);
  putFile("file:///downloads/explicit.mp4", 4096);
  expect(await clearSongCache()).toBe(2048);
  expect(new File("file:///downloads/explicit.mp4").exists).toBe(true);
  expect(songCacheStore.getState()).toMatchObject({ songs: {}, listens: {} });
});

it("cannot repopulate the cache when clear happens during a download", async () => {
  const { promise: pending, resolve: finish } = Promise.withResolvers<void>();
  jest
    .mocked(File.downloadFileAsync)
    .mockImplementationOnce(async (_url, file) => {
      await pending;
      const target = new File(file.uri);
      putFile(target.uri, 1024);
      return target;
    });
  await cacheQualifiedListen(track, "excellent");
  const download = cacheQualifiedListen(track, "excellent");
  await Promise.resolve();
  const clear = clearSongCache();
  finish();
  await download;
  await clear;
  expect(songCacheStore.getState()).toMatchObject({ songs: {}, listens: {} });
  expect(cacheBytes(songCacheStore.getState().songs)).toBe(0);
});

it("walks the cache directory once per app run, not per qualified listen", async () => {
  putFile("file:///cache/frequent-songs/orphan.mp4", 10);
  const list = jest.spyOn(Directory.prototype, "list");
  try {
    await qualify();
    await cacheQualifiedListen({ ...track, id: "other" }, "excellent");
    await cacheQualifiedListen({ ...track, id: "other" }, "excellent");
    expect(list).toHaveBeenCalledTimes(1);
  } finally {
    list.mockRestore();
  }
});

it("does not persist a play time on every load of a cached song", async () => {
  await qualify();
  const saved = jest.fn();
  const stop = songCacheStore.subscribe(saved);
  try {
    cachedSongSource(track, source);
    cachedSongSource(track, source);
    cachedSongSource(track, source);
    expect(saved).not.toHaveBeenCalled();
  } finally {
    stop();
  }
});

it("evicts by the latest play, including plays not yet persisted", async () => {
  const size = SONG_CACHE_LIMIT / 2;
  const now = Date.now();
  songCacheStore.setState({
    songs: {
      [track.id]: { filename: "played.mp4", source, size, lastPlayed: now - 9 },
      idle: { filename: "idle.mp4", source: "idle", size, lastPlayed: now - 5 },
    },
  });
  putFile("file:///cache/frequent-songs/played.mp4", size);
  putFile("file:///cache/frequent-songs/idle.mp4", size);
  expect(cachedSongSource(track, source)).toMatch(/^file:/);
  await cacheQualifiedListen({ ...track, id: "other" }, "excellent");
  await cacheQualifiedListen({ ...track, id: "other" }, "excellent");
  expect(songCacheStore.getState().songs.idle).toBeUndefined();
  expect(songCacheStore.getState().songs[track.id]).toBeDefined();
});

it("keeps at most 1,000 listen records, dropping the oldest", async () => {
  const listens = Object.fromEntries(
    Array.from({ length: 1000 }, (_, i) => [
      `song-${i}`,
      { count: 1, lastPlayed: i + 1 },
    ]),
  );
  songCacheStore.setState({ listens });
  await cacheQualifiedListen(track, "excellent");
  const kept = songCacheStore.getState().listens;
  expect(Object.keys(kept)).toHaveLength(1000);
  expect(kept["song-0"]).toBeUndefined();
  expect(kept[track.id]).toBeDefined();
});
