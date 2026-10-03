import { describe, expect, it } from "bun:test";

import { shouldIgnoreShortcut } from "../lib/keyboard";

const el = (tagName: string, role?: string) => ({
  tagName,
  getAttribute: (name: string) => (name === "role" && role ? role : null),
});

describe("shouldIgnoreShortcut", () => {
  it("lets shortcuts through on the page body", () => {
    expect(shouldIgnoreShortcut({ key: "n", target: el("BODY") })).toBe(false);
    expect(shouldIgnoreShortcut({ key: " ", target: el("BODY") })).toBe(false);
  });

  it("ignores every key while typing in a field", () => {
    for (const tag of ["INPUT", "TEXTAREA", "SELECT"]) {
      expect(shouldIgnoreShortcut({ key: "s", target: el(tag) })).toBe(true);
      expect(shouldIgnoreShortcut({ key: " ", target: el(tag) })).toBe(true);
    }
    expect(
      shouldIgnoreShortcut({
        key: "n",
        target: { tagName: "DIV", isContentEditable: true },
      }),
    ).toBe(true);
  });

  it("leaves Space to focused controls but not letter shortcuts", () => {
    expect(shouldIgnoreShortcut({ key: " ", target: el("BUTTON") })).toBe(true);
    expect(shouldIgnoreShortcut({ key: " ", target: el("A") })).toBe(true);
    expect(
      shouldIgnoreShortcut({ key: " ", target: el("SPAN", "slider") }),
    ).toBe(true);
    expect(shouldIgnoreShortcut({ key: "n", target: el("BUTTON") })).toBe(
      false,
    );
  });

  it("ignores modified chords and already-handled events", () => {
    expect(
      shouldIgnoreShortcut({ key: "s", ctrlKey: true, target: el("BODY") }),
    ).toBe(true);
    expect(
      shouldIgnoreShortcut({ key: "p", metaKey: true, target: el("BODY") }),
    ).toBe(true);
    expect(
      shouldIgnoreShortcut({
        key: "l",
        defaultPrevented: true,
        target: el("BODY"),
      }),
    ).toBe(true);
  });
});
