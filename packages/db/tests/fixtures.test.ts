import { describe, expect, it } from "bun:test";

import {
  DEFAULT_LOCAL_DEV_FIXTURE,
  getLocalDevFixture,
  LOCAL_DEV_AMA,
  LOCAL_DEV_DATABASE,
  LOCAL_DEV_FIXTURE,
  LOCAL_DEV_INFINITUNES,
  LOCAL_DEV_REDIS,
  LOCAL_DEV_USER,
} from "../src/fixtures/local-dev-user";

describe("local development fixtures", () => {
  it("exports canonical shared user credentials", () => {
    expect(LOCAL_DEV_USER.id).toBe("a0000000-0000-4000-8000-000000000001");
    expect(LOCAL_DEV_USER.email).toBe("local@example.test");
    expect(LOCAL_DEV_USER.password).toBe("LocalDev123!");
    expect(LOCAL_DEV_USER.name).toBe("Local Developer");
    expect(LOCAL_DEV_USER.username).toBe("localdev");
    expect(LOCAL_DEV_USER.displayUsername).toBe("localdev");
    expect(LOCAL_DEV_USER.emailVerified).toBe(true);
  });

  it("exports AMA anonymous fixture actor and host", () => {
    expect(LOCAL_DEV_AMA.actorId).toBe("a0000000-0000-4000-8000-000000000002");
    expect(LOCAL_DEV_AMA.hostId).toBe("a0000000-0000-4000-8000-000000000003");
    expect(LOCAL_DEV_AMA.isAnonymous).toBe(true);
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

  it("getLocalDevFixture falls back to default if no config path provided", () => {
    const fixture = getLocalDevFixture();
    expect(fixture.user.email).toBe(DEFAULT_LOCAL_DEV_FIXTURE.user.email);
  });
});
