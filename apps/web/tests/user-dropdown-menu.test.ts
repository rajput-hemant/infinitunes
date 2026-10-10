import { describe, expect, it } from "bun:test";

const USER_DROPDOWN = new URL(
  "../components/user-dropdown.tsx",
  import.meta.url,
);

describe("user dropdown menu", () => {
  it("sizes menu items from the control tokens at the call site", async () => {
    const source = await Bun.file(USER_DROPDOWN).text();

    expect(source).toContain(
      "[&_[data-slot=dropdown-menu-item]]:min-h-(--ctl)",
    );
    expect(source).toContain(
      "[&_[data-slot=dropdown-menu-item]]:pointer-coarse:min-h-(--ctl-lg)",
    );
  });
});
