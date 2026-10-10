import { describe, expect, it } from "bun:test";

import {
  FALLBACK_GREETING,
  formatGreeting,
  greetingForHour,
} from "../../app/(root)/_components/greeting";

describe("greetingForHour", () => {
  it("splits the day at noon and 18:00", () => {
    expect(greetingForHour(0)).toBe("Good morning");
    expect(greetingForHour(11)).toBe("Good morning");
    expect(greetingForHour(12)).toBe("Good afternoon");
    expect(greetingForHour(17)).toBe("Good afternoon");
    expect(greetingForHour(18)).toBe("Good evening");
    expect(greetingForHour(23)).toBe("Good evening");
  });
});

describe("formatGreeting", () => {
  it("appends the signed-in name", () => {
    expect(formatGreeting("Good evening", "Ada")).toBe("Good evening, Ada");
  });

  it("falls back to the bare salutation without a usable name", () => {
    expect(formatGreeting(FALLBACK_GREETING)).toBe("Welcome");
    expect(formatGreeting("Good morning", null)).toBe("Good morning");
    expect(formatGreeting("Good morning", "  ")).toBe("Good morning");
  });
});
