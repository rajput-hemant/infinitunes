import { describe, expect, it } from "bun:test";

import { getTableConfig } from "drizzle-orm/pg-core";

import * as schema from "../src/schema";

describe("schema exports", () => {
  it("exports all legacy auth tables", () => {
    expect(schema.users).toBeDefined();
    expect(schema.accounts).toBeDefined();
    expect(schema.verificationTokens).toBeDefined();
  });

  it("exports all better auth tables", () => {
    expect(schema.betterAuthAccounts).toBeDefined();
    expect(schema.betterAuthSessions).toBeDefined();
    expect(schema.betterAuthVerifications).toBeDefined();
  });

  it("exports app tables", () => {
    expect(schema.myPlaylists).toBeDefined();
    expect(schema.favorites).toBeDefined();
    expect(schema.recentlyPlayed).toBeDefined();
  });

  it("recently_played is prefixed and keyed per user and item", () => {
    const { name, indexes } = getTableConfig(schema.recentlyPlayed);
    expect(name).toBe("infinitunes_recently_played");
    const unique = indexes.find((i) => i.config.unique);
    expect(
      unique?.config.columns.map((c) => (c as { name: string }).name),
    ).toEqual(["userId", "itemType", "itemId"]);
  });

  it("user table retains all legacy columns", () => {
    const t = schema.users;
    expect(t.id).toBeDefined();
    expect(t.name).toBeDefined();
    expect(t.email).toBeDefined();
    expect(t.password).toBeDefined();
    expect(t.emailVerified).toBeDefined();
    expect(t.image).toBeDefined();
  });

  it("user table has Better Auth compatibility columns", () => {
    const t = schema.users;
    expect(t.betterAuthName).toBeDefined();
    expect(t.emailVerifiedBoolean).toBeDefined();
    expect(t.createdAt).toBeDefined();
    expect(t.updatedAt).toBeDefined();
  });

  it("user table does NOT have admin plugin columns", () => {
    const t = schema.users;
    expect((t as unknown as Record<string, unknown>).role).toBeUndefined();
    expect((t as unknown as Record<string, unknown>).banned).toBeUndefined();
    expect((t as unknown as Record<string, unknown>).banReason).toBeUndefined();
    expect(
      (t as unknown as Record<string, unknown>).banExpires,
    ).toBeUndefined();
  });

  it("better_auth_account has expected columns", () => {
    const t = schema.betterAuthAccounts;
    expect(t.id).toBeDefined();
    expect(t.userId).toBeDefined();
    expect(t.accountId).toBeDefined();
    expect(t.providerId).toBeDefined();
    expect(t.accessToken).toBeDefined();
    expect(t.refreshToken).toBeDefined();
    expect(t.password).toBeDefined();
  });

  it("better_auth_session has expected columns", () => {
    const t = schema.betterAuthSessions;
    expect(t.id).toBeDefined();
    expect(t.userId).toBeDefined();
    expect(t.token).toBeDefined();
    expect(t.expiresAt).toBeDefined();
    expect(t.ipAddress).toBeDefined();
    expect(t.userAgent).toBeDefined();
  });

  it("better_auth_verification has expected columns", () => {
    const t = schema.betterAuthVerifications;
    expect(t.id).toBeDefined();
    expect(t.identifier).toBeDefined();
    expect(t.value).toBeDefined();
    expect(t.expiresAt).toBeDefined();
  });
});
