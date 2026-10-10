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

  it("uses controlStyles in the shared email and password fields", async () => {
    expect(await read("email-field.tsx")).toContain("controlStyles.text");
    expect(await read("password-field.tsx")).toContain("controlStyles.text");
  });

  it("sizes the password visibility toggle with the header icon control", async () => {
    expect(await read("password-field.tsx")).toContain(
      "controlStyles.headerIcon",
    );
  });

  it("uses controlStyles.text full-width actions on login and the OAuth buttons", async () => {
    const action = 'cn(controlStyles.text, "w-full")';
    expect(await read("login-form.tsx")).toContain(action);
    expect(await read("oauth-buttons.tsx")).toContain(action);
  });
});
