import { describe, expect, it } from "bun:test";

import { controlStyles } from "~/lib/control-styles";

const COMPONENTS = "../app/(auth)/_components/";

async function read(name: string) {
  return Bun.file(new URL(COMPONENTS + name, import.meta.url)).text();
}

describe("auth form control sizes", () => {
  it("keeps the shared text and icon controls configured", () => {
    expect(controlStyles.text).toBeDefined();
    expect(controlStyles.headerIcon).toBeDefined();
  });

  it("builds every auth control style from controlStyles", async () => {
    const styles = await read("field-styles.ts");
    expect(styles).toContain("controlStyles.textLg");
    expect(styles).toContain("controlStyles.text,");
  });

  it("sizes the shared email and password fields with the auth input style", async () => {
    expect(await read("email-field.tsx")).toContain("authInputStyles");
    expect(await read("password-field.tsx")).toContain("authInputStyles");
  });

  it("sizes the password visibility toggle with the header icon control", async () => {
    expect(await read("password-field.tsx")).toContain(
      "controlStyles.headerIcon",
    );
  });

  it("uses the shared full-width action styles on login and the OAuth buttons", async () => {
    expect(await read("login-form.tsx")).toContain("authPrimaryButtonStyles");
    expect(await read("login-form.tsx")).toContain("authSquareLgButtonStyles");
    expect(await read("oauth-buttons.tsx")).toContain("authSquareButtonStyles");
  });
});
