import { expect, it } from "bun:test";

import {
  SESSION_COOKIE_PREFIXES,
  sessionCookiePrefix,
} from "../src/session-cookie";

it("uses a distinct session cookie prefix outside production only", () => {
  expect(sessionCookiePrefix("development")).toBe("infinitunes");
  expect(sessionCookiePrefix("test")).toBe("infinitunes");
  expect(sessionCookiePrefix("production")).toBeUndefined();
});

it("lists the default and the local prefix for native clients", () => {
  expect(SESSION_COOKIE_PREFIXES).toEqual(["better-auth", "infinitunes"]);
});
