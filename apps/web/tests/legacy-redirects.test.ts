import { describe, expect, it } from "bun:test";

import { legacySettingsRedirects } from "../lib/legacy-redirects";

describe("legacy settings redirects", () => {
  it("moves each old settings route permanently to its section", () => {
    expect(legacySettingsRedirects).toEqual([
      {
        source: "/settings/appearance",
        destination: "/settings#appearance",
        permanent: true,
      },
      {
        source: "/settings/preferences",
        destination: "/settings#playback",
        permanent: true,
      },
    ]);
  });

  it("points every destination at an existing section id of the page", async () => {
    const { settingsNavItems } =
      await import("../app/(root)/settings/_components/settings-nav-groups");
    const ids = new Set(settingsNavItems.map((item) => item.id));
    for (const { destination } of legacySettingsRedirects) {
      expect(ids.has(destination.split("#")[1] ?? "")).toBe(true);
    }
  });
});
