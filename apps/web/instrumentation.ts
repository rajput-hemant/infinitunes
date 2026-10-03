import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

interface LocalDevFixture {
  version: string;
  description: string;
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
    url: string;
  };
  redis: {
    host: string;
    port: number;
    restUrl: string;
    restToken: string;
  };
  user: {
    id: string;
    email: string;
    password: string;
    name: string;
    emailVerified: boolean;
  };
  infinitunes: {
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
  };
}

function isLoopbackHost(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (
      parsed.searchParams.has("host") ||
      parsed.searchParams.has("hostaddr")
    ) {
      return false;
    }
    return LOOPBACK_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function loadLocalDevFixture(): LocalDevFixture | null {
  const fixturePath = join(
    process.cwd(),
    "..",
    "..",
    "local-dev",
    "fixtures.json",
  );
  if (!existsSync(fixturePath)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(fixturePath, "utf-8")) as LocalDevFixture;
  } catch {
    return null;
  }
}

export async function register(): Promise<void> {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || !isLoopbackHost(databaseUrl)) {
    return;
  }

  const fixture = loadLocalDevFixture();
  if (!fixture) {
    return;
  }

  const { user, database, redis } = fixture;

  console.log("");
  console.log(
    "╔══════════════════════════════════════════════════════════════╗",
  );
  console.log(
    "║  Infinitunes — Local Development Credentials                  ║",
  );
  console.log(
    "╠══════════════════════════════════════════════════════════════╣",
  );
  console.log(
    "║  User                                                         ║",
  );
  console.log(`║    Email:    ${user.email.padEnd(45)}║`);
  console.log(`║    Password: ${user.password.padEnd(45)}║`);
  console.log(`║    Name:     ${user.name.padEnd(45)}║`);
  console.log(`║    ID:       ${user.id.padEnd(45)}║`);
  console.log(
    "╠══════════════════════════════════════════════════════════════╣",
  );
  console.log(
    "║  Database                                                     ║",
  );
  console.log(`║    Host:     ${database.host.padEnd(45)}║`);
  console.log(`║    Port:     ${String(database.port).padEnd(45)}║`);
  console.log(`║    User:     ${database.user.padEnd(45)}║`);
  console.log(`║    Password: ${database.password.padEnd(45)}║`);
  console.log(`║    Name:     ${database.name.padEnd(45)}║`);
  console.log(`║    URL:      ${database.url.padEnd(45)}║`);
  console.log(
    "╠══════════════════════════════════════════════════════════════╣",
  );
  console.log(
    "║  Redis                                                        ║",
  );
  console.log(`║    Host:       ${redis.host.padEnd(45)}║`);
  console.log(`║    Port:       ${String(redis.port).padEnd(45)}║`);
  console.log(`║    REST URL:   ${redis.restUrl.padEnd(45)}║`);
  console.log(`║    REST Token: ${redis.restToken.padEnd(45)}║`);
  console.log(
    "╚══════════════════════════════════════════════════════════════╝",
  );
  console.log("");
}
