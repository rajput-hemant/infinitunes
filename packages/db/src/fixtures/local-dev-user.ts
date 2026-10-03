import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

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

export const DEFAULT_LOCAL_DEV_FIXTURE: LocalDevFixture = {
  version: "1.0.0",
  description:
    "Shared local development canonical fixtures for Infinitunes, Lipi, and AMA",
  database: {
    host: "127.0.0.1",
    port: 5432,
    user: "postgres",
    password: "postgrespassword",
    name: "local_platforms",
    url: "postgresql://postgres:postgrespassword@127.0.0.1:5432/local_platforms",
  },
  redis: {
    host: "127.0.0.1",
    port: 6379,
    restUrl: "http://127.0.0.1:8079",
    restToken: "localdevtoken",
  },
  user: {
    id: "a0000000-0000-4000-8000-000000000001",
    email: "local@example.test",
    password: "LocalDev123!",
    name: "Local Developer",
    username: "localdev",
    displayUsername: "localdev",
    emailVerified: true,
  },
  ama: {
    actorId: "a0000000-0000-4000-8000-000000000002",
    hostId: "a0000000-0000-4000-8000-000000000003",
    actorName: "Anonymous Local Actor",
    hostName: "Anonymous Local Host",
    isAnonymous: true,
  },
  infinitunes: {
    playlists: [
      {
        id: "b0000000-0000-4000-8000-000000000001",
        name: "Local Favorites",
        description: "Deterministic local development playlist",
        songs: ["OF0RBBVqWXI", "c911v0kF"],
      },
    ],
    favorites: {
      id: "c0000000-0000-4000-8000-000000000001",
      songs: ["OF0RBBVqWXI"],
      albums: [],
      playlists: ["b0000000-0000-4000-8000-000000000001"],
      artists: [],
      podcasts: [],
    },
  },
};

/**
 * Loads the shared local dev fixture. If LOCAL_DEV_CONFIG environment variable
 * points to a valid JSON file, it parses that; otherwise uses DEFAULT_LOCAL_DEV_FIXTURE.
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
