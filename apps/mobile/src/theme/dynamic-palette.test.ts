import { toVariables, withDynamicRoles } from "./dynamic-palette";
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

  it("fades supporting text when the system resolves it to the text colour (One UI)", () => {
    const palette = withDynamicRoles(colors.dark, (role) =>
      role === "onSurface" || role === "onSurfaceVariant" ? "#fcfcff" : null,
    );

    expect(palette.foreground).toBe("#fcfcff");
    expect(palette["muted-foreground"]).toBe("rgba(252, 252, 255, 0.72)");
  });
});

describe("toVariables", () => {
  it("names every token's variable after it", () => {
    const variables = toVariables(colors.dark);

    expect(variables["--background"]).toBe(colors.dark.background);
    expect(variables["--fill-2"]).toBe(colors.dark["fill-2"]);
    expect(Object.keys(variables)).toHaveLength(
      Object.keys(colors.dark).length,
    );
  });
});
