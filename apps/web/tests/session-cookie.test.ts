import { expect, it } from "bun:test";

import { sessionCookiePrefix } from "~/lib/session-cookie";

it("uses a distinct session cookie prefix outside production only", () => {
  expect(sessionCookiePrefix("development")).toBe("infinitunes");
  expect(sessionCookiePrefix("test")).toBe("infinitunes");
  expect(sessionCookiePrefix("production")).toBeUndefined();
});
