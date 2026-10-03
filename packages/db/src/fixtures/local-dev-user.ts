import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import canonicalFixture from "../../../../local-dev/fixtures.json";

export interface LocalDevUser {
  id: string;
  email: string;
  password: string;
  name: string;
  username: string;
  displayUsername: string;
  emailVerified: boolean;
}

export interface LocalDevAma {
  actorId: string;
  hostId: string;
  actorName: string;
  hostName: string;
  isAnonymous: boolean;
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
  ama: LocalDevAma;
  infinitunes: LocalDevInfinitunes;
}

export const DEFAULT_LOCAL_DEV_FIXTURE: LocalDevFixture =
  canonicalFixture as LocalDevFixture;

/**
 * Loads the shared local dev fixture. If LOCAL_DEV_CONFIG environment variable
 * points to a valid JSON file, it parses that; otherwise uses DEFAULT_LOCAL_DEV_FIXTURE
 * sourced directly from canonical local-dev/fixtures.json.
 */
export function getLocalDevFixture(): LocalDevFixture {
  const candidatePaths = [
    process.env.LOCAL_DEV_CONFIG,
    resolve(process.cwd(), "local-dev/fixtures.json"),
    resolve(process.cwd(), "../../local-dev/fixtures.json"),
  ];

  for (const candidate of candidatePaths) {
    if (candidate && existsSync(candidate)) {
      try {
        const raw = readFileSync(candidate, "utf-8");
        return { ...DEFAULT_LOCAL_DEV_FIXTURE, ...JSON.parse(raw) };
      } catch (err) {
        console.warn(
          `[local-dev] Failed to parse fixture at ${candidate}`,
          err,
        );
      }
    }
  }

  return DEFAULT_LOCAL_DEV_FIXTURE;
}

export const LOCAL_DEV_FIXTURE = getLocalDevFixture();
export const LOCAL_DEV_USER = LOCAL_DEV_FIXTURE.user;
export const LOCAL_DEV_AMA = LOCAL_DEV_FIXTURE.ama;
export const LOCAL_DEV_INFINITUNES = LOCAL_DEV_FIXTURE.infinitunes;
export const LOCAL_DEV_DATABASE = LOCAL_DEV_FIXTURE.database;
export const LOCAL_DEV_REDIS = LOCAL_DEV_FIXTURE.redis;
