import { existsSync, readFileSync } from "node:fs";

import canonicalFixture from "../../../../local-dev/fixtures.json";

export interface LocalDevUser {
  id: string;
  email: string;
  password: string;
  name: string;
  emailVerified: boolean;
}

export interface LocalDevInfinitunes {
  playlists: Array<{
    id: string;
    name: string;
    description: string;
    songs: string[];
  }>;
  favorites: {
    id: string;
    songs: string[];
    albums: string[];
    playlists: string[];
    artists: string[];
    podcasts: string[];
  };
}

export interface LocalDevDatabase {
  host: string;
  port: number;
  user: string;
  password: string;
  name: string;
  url: string;
}

export interface LocalDevRedis {
  host: string;
  port: number;
  restUrl: string;
  restToken: string;
}

export interface LocalDevFixture {
  version: string;
  description: string;
  database: LocalDevDatabase;
  redis: LocalDevRedis;
  user: LocalDevUser;
  infinitunes: LocalDevInfinitunes;
}

const DEFAULT_LOCAL_DEV_FIXTURE = parseLocalDevFixture(canonicalFixture);

type Rec = Record<string, unknown>;

function fail(path: string, expected: string): never {
  throw new Error(
    `[local-dev] Invalid LOCAL_DEV_CONFIG fixture: "${path}" must be ${expected}`,
  );
}

function rec(value: unknown, path: string): Rec {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(path, "an object");
  }
  return value as Rec;
}

function str(o: Rec, key: string, path: string): string {
  const v = o[key];
  if (typeof v !== "string" || v.length === 0) {
    fail(`${path}.${key}`, "a non-empty string");
  }
  return v as string;
}

function num(o: Rec, key: string, path: string): number {
  const v = o[key];
  if (typeof v !== "number" || !Number.isInteger(v)) {
    fail(`${path}.${key}`, "an integer");
  }
  return v as number;
}

function bool(o: Rec, key: string, path: string): boolean {
  const v = o[key];
  if (typeof v !== "boolean") fail(`${path}.${key}`, "a boolean");
  return v as boolean;
}

function strings(o: Rec, key: string, path: string): string[] {
  const v = o[key];
  if (!Array.isArray(v) || v.some((x) => typeof x !== "string")) {
    fail(`${path}.${key}`, "an array of strings");
  }
  return v as string[];
}

/** Validates a parsed fixture; throws on any missing or mistyped field. */
export function parseLocalDevFixture(input: unknown): LocalDevFixture {
  const root = rec(input, "$");
  const db = rec(root.database, "database");
  const redis = rec(root.redis, "redis");
  const user = rec(root.user, "user");
  const inf = rec(root.infinitunes, "infinitunes");
  const fav = rec(inf.favorites, "infinitunes.favorites");
  if (!Array.isArray(inf.playlists)) {
    fail("infinitunes.playlists", "an array");
  }

  return {
    version: str(root, "version", "$"),
    description: str(root, "description", "$"),
    database: {
      host: str(db, "host", "database"),
      port: num(db, "port", "database"),
      user: str(db, "user", "database"),
      password: str(db, "password", "database"),
      name: str(db, "name", "database"),
      url: str(db, "url", "database"),
    },
    redis: {
      host: str(redis, "host", "redis"),
      port: num(redis, "port", "redis"),
      restUrl: str(redis, "restUrl", "redis"),
      restToken: str(redis, "restToken", "redis"),
    },
    user: {
      id: str(user, "id", "user"),
      email: str(user, "email", "user"),
      password: str(user, "password", "user"),
      name: str(user, "name", "user"),
      emailVerified: bool(user, "emailVerified", "user"),
    },
    infinitunes: {
      playlists: inf.playlists.map((raw, i) => {
        const path = `infinitunes.playlists[${i}]`;
        const pl = rec(raw, path);
        return {
          id: str(pl, "id", path),
          name: str(pl, "name", path),
          description: str(pl, "description", path),
          songs: strings(pl, "songs", path),
        };
      }),
      favorites: {
        id: str(fav, "id", "infinitunes.favorites"),
        songs: strings(fav, "songs", "infinitunes.favorites"),
        albums: strings(fav, "albums", "infinitunes.favorites"),
        playlists: strings(fav, "playlists", "infinitunes.favorites"),
        artists: strings(fav, "artists", "infinitunes.favorites"),
        podcasts: strings(fav, "podcasts", "infinitunes.favorites"),
      },
    },
  };
}

/**
 * Loads the shared local-dev fixture. With LOCAL_DEV_CONFIG set, that file is
 * read and validated and any failure throws (no silent fallback). Otherwise
 * the bundled canonical `local-dev/fixtures.json` is used.
 */
export function getLocalDevFixture(
  configPath = process.env.LOCAL_DEV_CONFIG,
): LocalDevFixture {
  if (!configPath) return DEFAULT_LOCAL_DEV_FIXTURE;
  if (!existsSync(configPath)) {
    throw new Error(
      `[local-dev] LOCAL_DEV_CONFIG points to a missing file: ${configPath}`,
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(configPath, "utf-8"));
  } catch (err) {
    throw new Error(
      `[local-dev] LOCAL_DEV_CONFIG is not valid JSON: ${configPath} (${(err as Error).message})`,
    );
  }
  return parseLocalDevFixture(parsed);
}
