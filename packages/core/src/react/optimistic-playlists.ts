import { useEffect, useMemo, useSyncExternalStore } from "react";

/** One row of the `playlist` table, as `getPlaylistDetails` and every write return it. */
export type UserPlaylist = {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  songs: string[];
  createdAt: Date;
};

/**
 * Shared optimistic playlist state. The viewer's library comes from the server
 * and only changes after a write has finished and the route has refreshed, so
 * each write is also recorded here at click time and layered over the server
 * list: the sidebar, the add-to-playlist dialog, the playlist grid and the
 * playlist page all read the same overlay and change in the same frame.
 *
 * A record is dropped when the refreshed server data agrees with it
 * (`reconcile`), when its write fails (rolled back, the caller toasts), or
 * after `EXPIRY_MS` once it has settled, which covers a refresh that never
 * delivers matching data.
 *
 * Creating is the one write that cannot be fully optimistic: the id is minted
 * by the database. The new row appears at once as `pending` (no link, dimmed)
 * and takes the real id when the write returns.
 */
export type PlaylistView = PlaylistSummary & { pending?: boolean };

/**
 * A library entry as `getUserPlaylists` returns it: the song count and the
 * first four ids (covers) instead of the whole list, which only the detail
 * query carries.
 */
export type PlaylistSummary = Omit<UserPlaylist, "userId" | "songs"> & {
  songCount: number;
  coverSongs: string[];
};

type Created = {
  tempId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  real?: UserPlaylist;
};
type Renamed = {
  name: string;
  description: string | null;
  settled: boolean;
  failed?: boolean;
  prev?: Renamed;
};
// Songs are matched by id, never by position: the server stores a song once per
// playlist (adds dedupe), and a position goes stale as soon as any earlier write lands.
type SongEdit = { songId: string; settled: boolean; sequence: number };
// A move records the order the listener left the playlist in; later moves replace it.
type Moved = {
  order: readonly string[];
  settled: boolean;
  failed?: boolean;
  prev?: Moved;
};

const EXPIRY_MS = 10000;

const created: Created[] = [];
const renamed = new Map<string, Renamed>();
const deleted = new Map<string, { settled: boolean }>();
const added = new Map<string, SongEdit[]>();
const removed = new Map<string, SongEdit[]>();
const moved = new Map<string, Moved>();
const queues = new Map<string, Promise<unknown>>();

/** Immutable copy of the records, replaced on every change: the store snapshot. */
type OverlayState = {
  created: readonly Created[];
  renamed: ReadonlyMap<string, Renamed>;
  deleted: ReadonlyMap<string, { settled: boolean }>;
  added: ReadonlyMap<string, readonly SongEdit[]>;
  removed: ReadonlyMap<string, readonly SongEdit[]>;
  moved: ReadonlyMap<string, Moved>;
};

const emptyState: OverlayState = {
  created: [],
  renamed: new Map(),
  deleted: new Map(),
  added: new Map(),
  removed: new Map(),
  moved: new Map(),
};

let state = emptyState;
let nextTemp = 0;
let nextSongEdit = 0;
const listeners = new Set<() => void>();

function bump() {
  state = {
    created: [...created],
    renamed: new Map(renamed),
    deleted: new Map(deleted),
    added: new Map(added),
    removed: new Map(removed),
    moved: new Map(moved),
  };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function expire(drop: () => void) {
  setTimeout(() => {
    drop();
    bump();
  }, EXPIRY_MS);
}

function pushTo<T>(map: Map<string, T[]>, key: string, record: T) {
  map.set(key, [...(map.get(key) ?? []), record]);
}

function dropFrom<T>(map: Map<string, T[]>, key: string, record: T) {
  const rest = (map.get(key) ?? []).filter((r) => r !== record);
  if (rest.length) map.set(key, rest);
  else map.delete(key);
}

/** Songs change one write at a time per playlist, so indexes stay valid. */
function enqueue<T>(playlistId: string, run: () => Promise<T>): Promise<T> {
  const next = (queues.get(playlistId) ?? Promise.resolve())
    .catch(() => undefined)
    .then(run);
  queues.set(playlistId, next);
  return next;
}

type CreateInput = { name: string; description?: string };

/** Adds a pending row now; resolves with the created playlist, rejects (row removed) on failure. */
export async function createPlaylistOptimistic(
  input: CreateInput,
  send: () => Promise<UserPlaylist>,
): Promise<UserPlaylist> {
  nextTemp += 1;
  const record: Created = {
    tempId: `pending-${nextTemp}`,
    name: input.name,
    description: input.description || null,
    createdAt: new Date(),
  };
  created.push(record);
  bump();
  try {
    record.real = await send();
    bump();
    expire(() => {
      const at = created.indexOf(record);
      if (at !== -1) created.splice(at, 1);
    });
    return record.real;
  } catch (error) {
    const at = created.indexOf(record);
    if (at !== -1) created.splice(at, 1);
    bump();
    throw error;
  }
}

export async function renamePlaylistOptimistic(
  id: string,
  input: CreateInput,
  send: () => Promise<unknown>,
) {
  const record: Renamed = {
    name: input.name,
    description: input.description || null,
    settled: false,
    prev: renamed.get(id),
  };
  renamed.set(id, record);
  bump();
  try {
    await send();
    record.settled = true;
    bump();
    expire(() => {
      if (renamed.get(id) === record) renamed.delete(id);
    });
  } catch (error) {
    record.failed = true;
    while (record.prev?.failed) record.prev = record.prev.prev;
    if (renamed.get(id) === record) {
      if (record.prev) renamed.set(id, record.prev);
      else renamed.delete(id);
    }
    bump();
    throw error;
  }
}

export async function deletePlaylistOptimistic(
  id: string,
  send: () => Promise<unknown>,
) {
  const record = { settled: false };
  deleted.set(id, record);
  bump();
  try {
    await send();
    record.settled = true;
    bump();
    expire(() => {
      if (deleted.get(id) === record) deleted.delete(id);
    });
  } catch (error) {
    if (deleted.get(id) === record) deleted.delete(id);
    bump();
    throw error;
  }
}

/** Latest confirmed songs, retained until refreshed server data agrees. */
const confirmedSongs = new Map<string, readonly string[]>();
const queued = new Map<string, number>();

function songsOf(result: unknown): readonly string[] | undefined {
  if (typeof result !== "object" || result === null || !("songs" in result))
    return undefined;
  const { songs } = result;
  return Array.isArray(songs) && songs.every((s) => typeof s === "string")
    ? songs
    : undefined;
}

/**
 * One queued write for a playlist; tracks the songs the server holds in
 * between. The count goes up when the write is queued (see `queueWrite`), so
 * the tracked songs survive the gap between two queued writes.
 */
async function runWrite<T>(
  playlistId: string,
  run: () => Promise<T>,
): Promise<T> {
  try {
    const result = await run();
    const songs = songsOf(result);
    if (songs) {
      confirmedSongs.set(playlistId, songs);
      // A library summary cannot confirm songs (it has none), so the copy
      // also expires like the other records.
      expire(() => {
        if (!queued.has(playlistId) && confirmedSongs.get(playlistId) === songs)
          confirmedSongs.delete(playlistId);
      });
    } else confirmedSongs.delete(playlistId);
    return result;
  } finally {
    const left = (queued.get(playlistId) ?? 1) - 1;
    if (left > 0) queued.set(playlistId, left);
    else {
      queued.delete(playlistId);
    }
    bump();
  }
}

function queueWrite<T>(playlistId: string, run: () => Promise<T>): Promise<T> {
  queued.set(playlistId, (queued.get(playlistId) ?? 0) + 1);
  return enqueue(playlistId, () => runWrite(playlistId, run));
}

export function addSongsOptimistic(
  playlistId: string,
  songIds: readonly string[],
  send: () => Promise<unknown>,
) {
  const records: SongEdit[] = songIds.map((songId) => ({
    songId,
    settled: false,
    sequence: nextSongEdit++,
  }));
  for (const record of records) pushTo(added, playlistId, record);
  bump();
  return queueWrite(playlistId, async () => {
    try {
      const result = await send();
      for (const record of records) record.settled = true;
      bump();
      expire(() => {
        for (const record of records) dropFrom(added, playlistId, record);
      });
      return result;
    } catch (error) {
      for (const record of records) dropFrom(added, playlistId, record);
      bump();
      throw error;
    }
  });
}

/**
 * Hides the song now. `send` gets the index of the song in what the server
 * holds at that moment (earlier queued writes included), and the server
 * re-checks the id at that index, so a stale position can never remove a
 * different song. `serverSongs` is the list the click was made against.
 */
export function removeSongOptimistic(
  playlistId: string,
  songId: string,
  serverSongs: readonly string[] | undefined,
  send: (index: number) => Promise<unknown>,
) {
  const record: SongEdit = { songId, settled: false, sequence: nextSongEdit++ };
  pushTo(removed, playlistId, record);
  bump();
  return queueWrite(playlistId, async () => {
    try {
      const index = (
        confirmedSongs.get(playlistId) ??
        serverSongs ??
        []
      ).indexOf(songId);
      if (index === -1) throw new Error("Song is no longer in this playlist");
      const result = await send(index);
      record.settled = true;
      bump();
      expire(() => dropFrom(removed, playlistId, record));
      return result;
    } catch (error) {
      dropFrom(removed, playlistId, record);
      bump();
      throw error;
    }
  });
}

/** `order` without the songs `songs` lacks, then the songs `order` lacks, in place. */
function arrange(songs: readonly string[], order: readonly string[]) {
  const known = new Set(songs);
  const ordered = new Set(order);
  return [
    ...order.filter((id) => known.has(id)),
    ...songs.filter((id) => !ordered.has(id)),
  ];
}

/**
 * Shows the playlist in `order` now: its songs as they are on screen, with
 * `songId` already moved. `send` gets the song's index in what the server
 * holds at that moment (earlier queued writes included) and the index that
 * puts it where `order` has it; the server re-checks the id at `from`, so a
 * stale position never moves another song. `serverSongs` is the list the
 * drag was made against. A failure restores the previous order.
 */
export function moveSongOptimistic(
  playlistId: string,
  songId: string,
  order: readonly string[],
  serverSongs: readonly string[] | undefined,
  send: (from: number, to: number) => Promise<unknown>,
) {
  const record: Moved = {
    order: [...order],
    settled: false,
    prev: moved.get(playlistId),
  };
  moved.set(playlistId, record);
  bump();
  return queueWrite(playlistId, async () => {
    try {
      const held = confirmedSongs.get(playlistId) ?? serverSongs ?? [];
      const from = held.indexOf(songId);
      const to = arrange(held, order).indexOf(songId);
      if (from === -1) throw new Error("Song is no longer in this playlist");
      const result = await send(from, to);
      record.settled = true;
      bump();
      expire(() => {
        if (moved.get(playlistId) === record) moved.delete(playlistId);
      });
      return result;
    } catch (error) {
      record.failed = true;
      while (record.prev?.failed) record.prev = record.prev.prev;
      if (moved.get(playlistId) === record) {
        if (record.prev) moved.set(playlistId, record.prev);
        else moved.delete(playlistId);
      }
      bump();
      throw error;
    }
  });
}

/**
 * Drops the records `server` now agrees with; `at` is the snapshot being
 * checked. Song records are checked only against detail rows (a summary has
 * no songs; they expire instead), and only the whole library (`complete`)
 * proves a playlist is gone.
 */
function reconcile(
  server: readonly (UserPlaylist | PlaylistSummary)[],
  at: OverlayState,
  complete: boolean,
) {
  let changed = false;
  const byId = new Map(server.map((p) => [p.id, p]));
  const serverSongs = (id: string) => {
    const p = byId.get(id);
    if (p) return "songs" in p ? p.songs : undefined;
    return complete ? null : undefined;
  };

  for (const [id, songs] of confirmedSongs) {
    if (queued.has(id)) continue;
    const p = serverSongs(id);
    if (p === undefined) continue;
    if (
      !p ||
      (p.length === songs.length && p.every((s, i) => songs[i] === s))
    ) {
      confirmedSongs.delete(id);
      added.delete(id);
      removed.delete(id);
      moved.delete(id);
      changed = true;
    }
  }

  for (const record of at.created) {
    if (record.real && byId.has(record.real.id)) {
      const index = created.indexOf(record);
      if (index !== -1) created.splice(index, 1);
      changed = true;
    }
  }
  for (const [id, record] of at.deleted) {
    if (
      complete &&
      record.settled &&
      !byId.has(id) &&
      deleted.get(id) === record
    ) {
      deleted.delete(id);
      changed = true;
    }
  }
  for (const [id, record] of at.renamed) {
    const p = byId.get(id);
    if (
      record.settled &&
      renamed.get(id) === record &&
      (p
        ? p.name === record.name && p.description === record.description
        : complete)
    ) {
      renamed.delete(id);
      changed = true;
    }
  }
  for (const [id, records] of at.added) {
    if (confirmedSongs.has(id)) continue;
    const p = serverSongs(id);
    if (p === undefined) continue;
    for (const r of records) {
      if (r.settled && (!p || p.includes(r.songId))) {
        dropFrom(added, id, r);
        changed = true;
      }
    }
  }
  for (const [id, records] of at.removed) {
    if (confirmedSongs.has(id)) continue;
    const p = serverSongs(id);
    if (p === undefined) continue;
    for (const r of records) {
      if (r.settled && (!p || !p.includes(r.songId))) {
        dropFrom(removed, id, r);
        changed = true;
      }
    }
  }
  for (const [id, record] of at.moved) {
    if (confirmedSongs.has(id)) continue;
    const p = serverSongs(id);
    if (p === undefined) continue;
    const agrees = !p || arrange(p, record.order).every((s, i) => p[i] === s);
    if (record.settled && moved.get(id) === record && agrees) {
      moved.delete(id);
      changed = true;
    }
  }
  if (changed) bump();
}

type PlaylistDetailView = UserPlaylist & { pending?: boolean };

/** The songs `p` holds with the pending adds and removals applied. */
function heldSongs(
  p: { id: string; songs: readonly string[] },
  at: OverlayState,
): Set<string> {
  const additions = new Set(at.added.get(p.id));
  const kept = new Set(p.songs);
  for (const edit of songEdits(at, p.id)) {
    if (additions.has(edit)) kept.add(edit.songId);
    else kept.delete(edit.songId);
  }
  return kept;
}

function overlayDetails(
  server: readonly UserPlaylist[],
  at: OverlayState,
): PlaylistDetailView[] {
  const list: PlaylistDetailView[] = [];
  for (const p of server) {
    if (at.deleted.has(p.id)) continue;
    const meta = at.renamed.get(p.id);
    const kept = heldSongs(p, at);
    const order = at.moved.get(p.id)?.order;
    const songs = order ? arrange([...kept], order) : [...kept];
    list.push({
      ...p,
      name: meta?.name ?? p.name,
      description: meta ? meta.description : p.description,
      songs,
    });
  }
  return list;
}

function useOverlayState() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => emptyState,
  );
}

function songEdits(at: OverlayState, id: string) {
  return [...(at.added.get(id) ?? []), ...(at.removed.get(id) ?? [])].sort(
    (a, b) => a.sequence - b.sequence,
  );
}

/**
 * One summary with the song edits applied: counted against the latest
 * confirmed songs when a write has returned them, else against the server's
 * count (an add of a song the playlist already holds counts until its write
 * returns the real list).
 */
function summarize(p: PlaylistSummary, at: OverlayState): PlaylistView {
  const meta = at.renamed.get(p.id);
  const confirmed = confirmedSongs.get(p.id);
  const known = [...(confirmed ?? p.coverSongs)];
  let songCount = confirmed?.length ?? p.songCount;
  const additions = new Set(at.added.get(p.id));
  for (const edit of songEdits(at, p.id)) {
    // The confirmed songs already hold every settled edit.
    if (confirmed && edit.settled) continue;
    const index = known.indexOf(edit.songId);
    if (additions.has(edit)) {
      if (index === -1) {
        known.push(edit.songId);
        songCount += 1;
      }
    } else if (index !== -1 || !confirmed) {
      // Without confirmed songs a removed song past the covers is still counted.
      if (index !== -1) known.splice(index, 1);
      songCount -= 1;
    }
  }
  return {
    ...p,
    name: meta?.name ?? p.name,
    description: meta ? meta.description : p.description,
    songCount: Math.max(0, songCount),
    coverSongs: known.slice(0, 4),
  };
}

// One overlaid list per (server list, overlay state), shared by every reader.
const summaries = new WeakMap<
  readonly PlaylistSummary[],
  { at: OverlayState; list: PlaylistView[] }
>();

function overlaySummaries(
  server: readonly PlaylistSummary[],
  at: OverlayState,
): PlaylistView[] {
  const cached = summaries.get(server);
  if (cached?.at === at) return cached.list;
  const list = server
    .filter((p) => !at.deleted.has(p.id))
    .map((p) => summarize(p, at));
  const known = new Set(server.map((p) => p.id));
  for (const c of at.created) {
    if (c.real && known.has(c.real.id)) continue;
    list.push(
      c.real
        ? {
            id: c.real.id,
            name: c.real.name,
            description: c.real.description,
            createdAt: c.real.createdAt,
            songCount: c.real.songs.length,
            coverSongs: c.real.songs.slice(0, 4),
          }
        : {
            id: c.tempId,
            name: c.name,
            description: c.description,
            createdAt: c.createdAt,
            songCount: 0,
            coverSongs: [],
            pending: true,
          },
    );
  }
  summaries.set(server, { at, list });
  return list;
}

/**
 * The library as it should look now. `undefined` stays `undefined`: an unknown
 * library is not an empty one, so nothing is layered over it.
 */
export function usePlaylists(
  server: readonly PlaylistSummary[] | undefined,
): PlaylistView[] | undefined {
  const at = useOverlayState();

  useEffect(() => {
    if (server) reconcile(server, at, true);
  }, [server, at]);

  return server ? overlaySummaries(server, at) : undefined;
}

/**
 * Detail rows (some of the library, fetched by id) with the song edits
 * applied: membership and order where a screen needs the songs themselves.
 */
export function usePlaylistDetailList(
  server: readonly UserPlaylist[] | undefined,
): PlaylistDetailView[] | undefined {
  const at = useOverlayState();

  useEffect(() => {
    if (server) reconcile(server, at, false);
  }, [server, at]);

  return useMemo(
    () => (server ? overlayDetails(server, at) : undefined),
    [server, at],
  );
}

export type PlaylistSongs = { id: string; songs: readonly string[] };

// One map per (server list, overlay state), however many rows ask.
const songSets = new WeakMap<
  readonly PlaylistSongs[],
  { at: OverlayState; sets: ReadonlyMap<string, ReadonlySet<string>> }
>();

/**
 * The songs each playlist holds (`getPlaylistMembership`) with pending writes
 * applied, for "is this song in that playlist". Built once per server list and
 * overlay state and shared by every reader; it only reads, the library and
 * detail readers reconcile.
 */
export function usePlaylistSongSets(
  server: readonly PlaylistSongs[] | undefined,
): ReadonlyMap<string, ReadonlySet<string>> | undefined {
  const at = useOverlayState();
  if (!server) return undefined;
  const cached = songSets.get(server);
  if (cached?.at === at) return cached.sets;
  const sets = new Map(
    server
      .filter((p) => !at.deleted.has(p.id))
      .map((p) => [p.id, heldSongs(p, at)] as const),
  );
  songSets.set(server, { at, sets });
  return sets;
}

/** One playlist's detail row with the overlay applied; `null` stays `null`. */
export function usePlaylistDetails(server: UserPlaylist | null | undefined) {
  const list = useMemo(() => (server ? [server] : undefined), [server]);
  const playlist = usePlaylistDetailList(list)?.[0];
  return server === null ? null : playlist;
}

/** Name and description of one playlist with a pending rename applied. */
export function usePlaylistMeta(playlist: {
  id: string;
  name: string;
  description: string | null;
}) {
  const meta = useOverlayState().renamed.get(playlist.id);
  return {
    name: meta?.name ?? playlist.name,
    description: meta ? meta.description : playlist.description,
  };
}

export function usePlaylistGone(id: string) {
  return useOverlayState().deleted.has(id);
}

/** Whether this song's row on the playlist page was just removed. */
export function usePlaylistRowRemoved(playlistId: string, songId: string) {
  const at = useOverlayState();
  const last = songEdits(at, playlistId).findLast((r) => r.songId === songId);
  return (
    last !== undefined && (at.removed.get(playlistId) ?? []).includes(last)
  );
}

/** Playlists created this session that the server list does not have yet. */
export function useUnconfirmedPlaylists(serverIds: readonly string[]) {
  const known = new Set(serverIds);
  return useOverlayState().created.filter(
    (c) => !(c.real && known.has(c.real.id)),
  );
}

/** Test hook: forget every record. */
export function resetPlaylistOverlay() {
  created.length = 0;
  renamed.clear();
  deleted.clear();
  added.clear();
  removed.clear();
  moved.clear();
  queues.clear();
  queued.clear();
  confirmedSongs.clear();
  bump();
}
