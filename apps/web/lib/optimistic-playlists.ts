"use client";

import type { MyPlaylist } from "@infinitunes/db/schema";
import { useEffect, useSyncExternalStore } from "react";

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
export type PlaylistView = MyPlaylist & { pending?: boolean };

type Created = {
  tempId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  real?: MyPlaylist;
};
type Renamed = {
  name: string;
  description: string | null;
  settled: boolean;
  prev?: Renamed;
};
type Added = { songId: string; baseLen?: number; settled: boolean };
type Removed = {
  index: number;
  songId: string;
  baseLen?: number;
  settled: boolean;
  ok: boolean;
};

const EXPIRY_MS = 10000;

const created: Created[] = [];
const renamed = new Map<string, Renamed>();
const deleted = new Map<string, { settled: boolean }>();
const added = new Map<string, Added[]>();
const removed = new Map<string, Removed[]>();
const queues = new Map<string, Promise<unknown>>();

/** Immutable copy of the records, replaced on every change: the store snapshot. */
type OverlayState = {
  created: readonly Created[];
  renamed: ReadonlyMap<string, Renamed>;
  deleted: ReadonlyMap<string, { settled: boolean }>;
  added: ReadonlyMap<string, readonly Added[]>;
  removed: ReadonlyMap<string, readonly Removed[]>;
};

const emptyState: OverlayState = {
  created: [],
  renamed: new Map(),
  deleted: new Map(),
  added: new Map(),
  removed: new Map(),
};

let state = emptyState;
let nextTemp = 0;
const listeners = new Set<() => void>();

function bump() {
  state = {
    created: [...created],
    renamed: new Map(renamed),
    deleted: new Map(deleted),
    added: new Map(added),
    removed: new Map(removed),
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
  send: () => Promise<MyPlaylist>,
): Promise<MyPlaylist> {
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
    created.splice(created.indexOf(record), 1);
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

export function addSongsOptimistic(
  playlistId: string,
  songIds: readonly string[],
  serverLen: number | undefined,
  send: () => Promise<unknown>,
) {
  const records: Added[] = songIds.map((songId) => ({
    songId,
    baseLen: serverLen,
    settled: false,
  }));
  for (const record of records) pushTo(added, playlistId, record);
  bump();
  return enqueue(playlistId, async () => {
    try {
      await send();
      for (const record of records) record.settled = true;
      bump();
      expire(() => {
        for (const record of records) dropFrom(added, playlistId, record);
      });
    } catch (error) {
      for (const record of records) dropFrom(added, playlistId, record);
      bump();
      throw error;
    }
  });
}

/** `send` gets the index to use: earlier removals already applied shift it down. */
export function removeSongOptimistic(
  playlistId: string,
  dbIndex: number,
  songId: string,
  serverLen: number | undefined,
  send: (index: number) => Promise<unknown>,
) {
  const record: Removed = {
    index: dbIndex,
    songId,
    baseLen: serverLen,
    settled: false,
    ok: false,
  };
  pushTo(removed, playlistId, record);
  bump();
  return enqueue(playlistId, async () => {
    const earlier = (removed.get(playlistId) ?? []).filter(
      (r) => r !== record && r.ok && r.index < dbIndex,
    ).length;
    try {
      await send(dbIndex - earlier);
      record.ok = true;
      record.settled = true;
      bump();
      expire(() => dropFrom(removed, playlistId, record));
    } catch (error) {
      dropFrom(removed, playlistId, record);
      bump();
      throw error;
    }
  });
}

/** Drops the records `server` now agrees with; `at` is the snapshot being checked. */
function reconcile(server: readonly MyPlaylist[], at: OverlayState) {
  let changed = false;
  const byId = new Map(server.map((p) => [p.id, p]));

  for (const record of at.created) {
    if (record.real && byId.has(record.real.id)) {
      const index = created.indexOf(record);
      if (index !== -1) created.splice(index, 1);
      changed = true;
    }
  }
  for (const [id, record] of at.deleted) {
    if (record.settled && !byId.has(id) && deleted.get(id) === record) {
      deleted.delete(id);
      changed = true;
    }
  }
  for (const [id, record] of at.renamed) {
    const p = byId.get(id);
    if (
      record.settled &&
      renamed.get(id) === record &&
      (!p || (p.name === record.name && p.description === record.description))
    ) {
      renamed.delete(id);
      changed = true;
    }
  }
  for (const [id, records] of at.added) {
    const p = byId.get(id);
    for (const r of records) {
      if (
        r.settled &&
        (!p || (r.baseLen !== undefined && p.songs.length > r.baseLen))
      ) {
        dropFrom(added, id, r);
        changed = true;
      }
    }
  }
  for (const [id, records] of at.removed) {
    const p = byId.get(id);
    for (const r of records) {
      if (
        r.settled &&
        (!p || (r.baseLen !== undefined && p.songs.length < r.baseLen))
      ) {
        dropFrom(removed, id, r);
        changed = true;
      }
    }
  }
  if (changed) bump();
}

function overlay(
  server: readonly MyPlaylist[],
  at: OverlayState,
): PlaylistView[] {
  const list: PlaylistView[] = [];
  for (const p of server) {
    if (at.deleted.has(p.id)) continue;
    const meta = at.renamed.get(p.id);
    const gone = new Set((at.removed.get(p.id) ?? []).map((r) => r.index));
    const songs = [
      ...p.songs.filter((_, index) => !gone.has(index)),
      ...(at.added.get(p.id) ?? []).map((r) => r.songId),
    ];
    list.push({
      ...p,
      name: meta?.name ?? p.name,
      description: meta ? meta.description : p.description,
      songs,
    });
  }
  const known = new Set(server.map((p) => p.id));
  for (const c of at.created) {
    if (c.real && known.has(c.real.id)) continue;
    list.push(
      c.real
        ? { ...c.real }
        : {
            id: c.tempId,
            name: c.name,
            description: c.description,
            userId: "",
            songs: [],
            createdAt: c.createdAt,
            pending: true,
          },
    );
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

/**
 * The library as it should look now. `undefined` stays `undefined`: an unknown
 * library is not an empty one, so nothing is layered over it.
 */
export function usePlaylists(
  server: readonly MyPlaylist[] | undefined,
): PlaylistView[] | undefined {
  const at = useOverlayState();

  useEffect(() => {
    if (server) reconcile(server, at);
  }, [server, at]);

  return server ? overlay(server, at) : undefined;
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

/** Whether the row at `dbIndex` of the playlist page was just removed. */
export function usePlaylistRowRemoved(playlistId: string, dbIndex: number) {
  return (useOverlayState().removed.get(playlistId) ?? []).some(
    (r) => r.index === dbIndex,
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
  queues.clear();
  bump();
}
