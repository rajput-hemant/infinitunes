import { toRootVariables, withDynamicRoles } from "./dynamic-palette";
import { colors } from "./tokens";

describe("withDynamicRoles", () => {
  it("replaces mapped tokens and keeps the alpha ones and unresolved roles", () => {
    const palette = withDynamicRoles(colors.light, (role) =>
      role === "surfaceContainerHigh" ? null : `#${role}`,
    );

    expect(palette.background).toBe("#surface");
    expect(palette["muted-foreground"]).toBe("#onSurfaceVariant");
    expect(palette.card).toBe(colors.light.card);
    expect(palette.fill).toBe(colors.light.fill);
    expect(palette.scrim).toBe(colors.light.scrim);
  });
});

describe("toRootVariables", () => {
  it("sets only the given scheme of each variable", () => {
    expect(toRootVariables(colors.dark, "dark")["--background"]).toEqual({
      dark: colors.dark.background,
    });
  });
});
