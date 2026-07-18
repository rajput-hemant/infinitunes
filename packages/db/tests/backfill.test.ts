import { describe, expect, it } from "bun:test";

import {
  BACKFILL_ALL,
  BACKFILL_CREDENTIAL_ACCOUNTS,
  BACKFILL_OAUTH_ACCOUNTS,
  BACKFILL_VERIFICATION_TOKENS,
} from "../src/backfill";

describe("backfill SQL", () => {
  it("BACKFILL_OAUTH_ACCOUNTS targets better_auth_account from legacy account", () => {
    expect(BACKFILL_OAUTH_ACCOUNTS).toContain(
      'INSERT INTO "better_auth_account"',
    );
    expect(BACKFILL_OAUTH_ACCOUNTS).toContain('FROM "account"');
    expect(BACKFILL_OAUTH_ACCOUNTS).toContain("NOT EXISTS");
  });

  it("BACKFILL_VERIFICATION_TOKENS filters to unexpired records only", () => {
    expect(BACKFILL_VERIFICATION_TOKENS).toContain(
      'INSERT INTO "better_auth_verification"',
    );
    expect(BACKFILL_VERIFICATION_TOKENS).toContain('FROM "verificationToken"');
    expect(BACKFILL_VERIFICATION_TOKENS).toContain('"expires" > NOW()');
  });

  it("BACKFILL_CREDENTIAL_ACCOUNTS uses user.id as accountId", () => {
    expect(BACKFILL_CREDENTIAL_ACCOUNTS).toContain(
      'INSERT INTO "better_auth_account"',
    );
    expect(BACKFILL_CREDENTIAL_ACCOUNTS).toContain('u."id"');
    expect(BACKFILL_CREDENTIAL_ACCOUNTS).toContain("'credential'");
    expect(BACKFILL_CREDENTIAL_ACCOUNTS).not.toContain('u."email"');
  });

  it("BACKFILL_ALL concatenates all three with breakpoints", () => {
    expect(BACKFILL_ALL).toContain(BACKFILL_OAUTH_ACCOUNTS);
    expect(BACKFILL_ALL).toContain(BACKFILL_VERIFICATION_TOKENS);
    expect(BACKFILL_ALL).toContain(BACKFILL_CREDENTIAL_ACCOUNTS);
    expect(BACKFILL_ALL).toContain("statement-breakpoint");
  });
});
