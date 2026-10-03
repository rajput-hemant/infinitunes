import { describe, expect, it } from "bun:test";

const USER_DROPDOWN = new URL(
  "../components/user-dropdown.tsx",
  import.meta.url,
);

describe("user dropdown menu", () => {
  it("restores master row padding on menu items at the call site", async () => {
    const source = await Bun.file(USER_DROPDOWN).text();

    expect(source).toContain("[&_[data-slot=dropdown-menu-item]]:py-1.5");
  });
});
