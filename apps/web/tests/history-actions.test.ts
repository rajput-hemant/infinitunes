import { describe, expect, it } from "bun:test";

// Source-level check: `mock.module` is process-wide in bun and would leak a
// fake `lib/trpc/server` into the other suites.
describe("recordPlay", () => {
  it("relies on protectedProcedure for the only session lookup", async () => {
    const source = await Bun.file(
      new URL("../lib/history-actions.ts", import.meta.url),
    ).text();
    expect(source).not.toContain("getSession");
    expect(source).toContain('getErrorCode(error) === "UNAUTHORIZED"');
  });
});
