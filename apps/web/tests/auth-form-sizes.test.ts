import { describe, expect, it } from "bun:test";

const COMPONENTS = "../app/(auth)/_components/";

async function read(name: string) {
  return Bun.file(new URL(COMPONENTS + name, import.meta.url)).text();
}

describe("auth form control sizes", () => {
  it("uses h-10 inputs in the shared email and password fields", async () => {
    expect(await read("email-field.tsx")).toContain('"h-10 shadow-xs"');
    expect(await read("password-field.tsx")).toContain(
      '"h-10 pr-11 shadow-xs"',
    );
  });

  it("uses h-9 full-width actions on login and the OAuth buttons", async () => {
    const action = 'className="h-9 w-full font-semibold shadow-md"';
    expect(await read("login-form.tsx")).toContain(action);
    expect(await read("oauth-buttons.tsx")).toContain(action);
  });
});
