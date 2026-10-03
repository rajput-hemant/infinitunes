import { describe, expect, it } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  DEFAULT_LOCAL_DEV_FIXTURE,
  getLocalDevFixture,
  parseLocalDevFixture,
  LOCAL_DEV_DATABASE,
  LOCAL_DEV_FIXTURE,
  LOCAL_DEV_INFINITUNES,
  LOCAL_DEV_REDIS,
  LOCAL_DEV_USER,
} from "../src/fixtures/local-dev-user";
import { assertLocalDatabase } from "../src/fixtures/local-guard";

describe("local development fixtures", () => {
  it("exports canonical shared user credentials", () => {
    expect(LOCAL_DEV_USER.id).toBe("a0000000-0000-4000-8000-000000000001");
    expect(LOCAL_DEV_USER.email).toBe("local@example.test");
    expect(LOCAL_DEV_USER.password).toBe("LocalDev123!");
    expect(LOCAL_DEV_USER.name).toBe("Local Developer");
    expect(LOCAL_DEV_USER.emailVerified).toBe(true);
  });

  it("exports Infinitunes deterministic playlists and favorites", () => {
    expect(LOCAL_DEV_INFINITUNES.playlists.length).toBeGreaterThan(0);
    expect(LOCAL_DEV_INFINITUNES.playlists[0].id).toBe(
      "b0000000-0000-4000-8000-000000000001",
    );
    expect(LOCAL_DEV_INFINITUNES.favorites.id).toBe(
      "c0000000-0000-4000-8000-000000000001",
    );
  });

  it("exports canonical database and redis configs", () => {
    expect(LOCAL_DEV_DATABASE.port).toBe(5432);
    expect(LOCAL_DEV_DATABASE.name).toBe("local_platforms");
    expect(LOCAL_DEV_REDIS.port).toBe(6379);
    expect(LOCAL_DEV_REDIS.restUrl).toBe("http://127.0.0.1:8079");
    expect(LOCAL_DEV_REDIS.restToken).toBe("localdevtoken");
  });

  it("getLocalDevFixture returns the canonical fixture when no path is given", () => {
    expect(getLocalDevFixture(undefined)).toBe(DEFAULT_LOCAL_DEV_FIXTURE);
  });

  it("loads a valid supplied config", () => {
    const dir = mkdtempSync(join(tmpdir(), "fixture-"));
    const file = join(dir, "f.json");
    writeFileSync(file, JSON.stringify(DEFAULT_LOCAL_DEV_FIXTURE));
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
    const broken = structuredClone(DEFAULT_LOCAL_DEV_FIXTURE) as unknown as {
      user: { emailVerified: unknown };
    };
    broken.user.emailVerified = "yes";
    expect(() => parseLocalDevFixture(broken)).toThrow("user.emailVerified");
  });
});

describe("assertLocalDatabase", () => {
  const ok = (url: string) =>
    expect(() => assertLocalDatabase(url, undefined)).not.toThrow();
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
