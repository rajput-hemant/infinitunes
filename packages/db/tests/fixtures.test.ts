import { describe, expect, it } from "bun:test";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  getLocalDevFixture,
  parseLocalDevFixture,
} from "../src/fixtures/local-dev-user";
import {
  assertLocalDatabase,
  isLocalDatabase,
} from "../src/fixtures/local-guard";

const canonicalFixturePath = join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "local-dev",
  "fixtures.json",
);
const canonicalFixture = JSON.parse(
  readFileSync(canonicalFixturePath, "utf-8"),
);

describe("local development fixtures", () => {
  it("parses canonical shared user credentials", () => {
    const fixture = parseLocalDevFixture(canonicalFixture);
    expect(fixture.user.id).toBe("a0000000-0000-4000-8000-000000000001");
    expect(fixture.user.email).toBe("local@example.test");
    expect(fixture.user.password).toBe(canonicalFixture.user.password);
    expect(fixture.user.name).toBe("Local Developer");
    expect(fixture.user.emailVerified).toBe(true);
  });

  it("parses Infinitunes deterministic playlists and favorites", () => {
    const fixture = parseLocalDevFixture(canonicalFixture);
    expect(fixture.infinitunes.playlists.length).toBeGreaterThan(0);
    expect(fixture.infinitunes.playlists[0].id).toBe(
      "b0000000-0000-4000-8000-000000000001",
    );
    expect(fixture.infinitunes.favorites.id).toBe(
      "c0000000-0000-4000-8000-000000000001",
    );
  });

  it("parses sample favorites, playlists and recently played", () => {
    const { infinitunes } = parseLocalDevFixture(canonicalFixture);
    expect(infinitunes.playlists.length).toBeGreaterThanOrEqual(2);
    for (const playlist of infinitunes.playlists) {
      expect(playlist.songs.length).toBeGreaterThan(0);
    }
    expect(infinitunes.favorites.songs.length).toBeGreaterThan(0);
    expect(infinitunes.favorites.albums.length).toBeGreaterThan(0);
    expect(infinitunes.favorites.artists.length).toBeGreaterThan(0);
    expect(infinitunes.recentlyPlayed.length).toBeGreaterThan(0);
  });

  it("defaults recently played to empty for older fixture files", () => {
    const older = structuredClone(canonicalFixture);
    delete older.infinitunes.recentlyPlayed;
    expect(parseLocalDevFixture(older).infinitunes.recentlyPlayed).toEqual([]);
  });

  it("parses canonical database and redis configs", () => {
    const fixture = parseLocalDevFixture(canonicalFixture);
    expect(fixture.database.port).toBe(5432);
    expect(fixture.database.name).toBe("local_platforms");
    expect(fixture.redis.port).toBe(6379);
    expect(fixture.redis.restUrl).toBe("http://127.0.0.1:8079");
    expect(fixture.redis.restToken).toBe(canonicalFixture.redis.restToken);
  });

  it("getLocalDevFixture returns the canonical fixture when no path is given", () => {
    const fixture = getLocalDevFixture(undefined);
    expect(fixture.user.email).toBe("local@example.test");
  });

  it("loads a valid supplied config", () => {
    const dir = mkdtempSync(join(tmpdir(), "fixture-"));
    const file = join(dir, "f.json");
    writeFileSync(file, JSON.stringify(canonicalFixture));
    expect(getLocalDevFixture(file).user.email).toBe("local@example.test");
  });

  it("fails closed on a missing, malformed or schema-invalid supplied config", () => {
    const dir = mkdtempSync(join(tmpdir(), "fixture-"));
    expect(() => getLocalDevFixture(join(dir, "nope.json"))).toThrow(
      "missing file",
    );
    const bad = join(dir, "bad.json");
    writeFileSync(bad, "{not json");
    expect(() => getLocalDevFixture(bad)).toThrow("not valid JSON");
    const partial = join(dir, "partial.json");
    writeFileSync(
      partial,
      JSON.stringify({ user: { email: "attacker@example.test" } }),
    );
    expect(() => getLocalDevFixture(partial)).toThrow(
      "Invalid LOCAL_DEV_CONFIG",
    );
  });

  it("rejects a mistyped field", () => {
    const broken = structuredClone(canonicalFixture) as unknown as {
      user: { emailVerified: unknown };
    };
    broken.user.emailVerified = "yes";
    expect(() => parseLocalDevFixture(broken)).toThrow("user.emailVerified");
  });
});

describe("assertLocalDatabase", () => {
  const ok = (url: string) =>
    expect(() => assertLocalDatabase(url, "development")).not.toThrow();
  const refused = (url: string, env?: string) =>
    expect(() => assertLocalDatabase(url, env)).toThrow("Refusing");

  it("accepts loopback hosts", () => {
    ok("postgresql://u:p@localhost:5432/db");
    ok("postgresql://u:p@127.0.0.1:5432/db");
    ok("postgresql://u:p@[::1]:5432/db");
  });

  it("refuses non-loopback hosts, including query-string lookalikes", () => {
    refused(
      "postgresql://u:p@10.224.24.65:55433/db?application_name=localhost",
    );
    refused("postgresql://u:p@db.example.com/localhost");
    refused("postgresql://u:p@localhost.evil.com:5432/db");
    refused("postgresql://u:p@127.0.0.1.evil.com:5432/db");
  });

  it("refuses a host override in the query string", () => {
    refused("postgresql://u:p@localhost:5432/db?host=db.example.com");
  });

  it("refuses production and unparseable URLs", () => {
    refused("postgresql://u:p@localhost:5432/db", "production");
    refused("not a url");
  });
});

describe("isLocalDatabase", () => {
  it("mirrors assertLocalDatabase without throwing", () => {
    expect(
      isLocalDatabase("postgresql://u:p@127.0.0.1:5432/db", "development"),
    ).toBe(true);
    expect(
      isLocalDatabase("postgresql://u:p@db.example.com/db", "development"),
    ).toBe(false);
    expect(
      isLocalDatabase("postgresql://u:p@localhost:5432/db", "production"),
    ).toBe(false);
    expect(isLocalDatabase("not a url", "development")).toBe(false);
  });
});
