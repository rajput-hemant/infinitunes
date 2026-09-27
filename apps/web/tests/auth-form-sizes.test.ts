import { describe, expect, it } from "bun:test";

const LOGIN_FORM = new URL(
  "../app/(auth)/_components/login-form.tsx",
  import.meta.url,
);

describe("auth form control sizes", () => {
  it("uses master-parity h-10 inputs and h-9 submit on login", async () => {
    const source = await Bun.file(LOGIN_FORM).text();

    expect(source).toContain('className="h-10 pr-8 shadow-xs"');
    expect(source).toContain('className="h-9 w-full font-semibold shadow-md"');
  });
});
