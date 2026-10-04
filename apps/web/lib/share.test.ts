import { describe, expect, test } from "bun:test";

import { buildShareUrl } from "./share";

const target = { url: "https://x.test/song/a?b=1&c=2", title: "Hi & bye" };
const u = "https%3A%2F%2Fx.test%2Fsong%2Fa%3Fb%3D1%26c%3D2";

describe("buildShareUrl", () => {
  test("twitter", () => {
    expect(buildShareUrl("twitter", target)).toBe(
      `https://twitter.com/intent/tweet?url=${u}&text=Hi%20%26%20bye`,
    );
  });
  test("whatsapp combines title and url into one text param", () => {
    expect(buildShareUrl("whatsapp", target)).toBe(
      `https://wa.me/?text=Hi%20%26%20bye%20${u}`,
    );
  });
  test("telegram", () => {
    expect(buildShareUrl("telegram", target)).toBe(
      `https://t.me/share/url?url=${u}&text=Hi%20%26%20bye`,
    );
  });
  test("facebook", () => {
    expect(buildShareUrl("facebook", target)).toBe(
      `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    );
  });
  test("email", () => {
    expect(buildShareUrl("email", target)).toBe(
      `mailto:?subject=Hi%20%26%20bye&body=${u}`,
    );
  });
});
