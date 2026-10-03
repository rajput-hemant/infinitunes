import { describe, expect, it } from "bun:test";

const SIGNUP_FORM = new URL(
  "../app/(auth)/_components/signup-form.tsx",
  import.meta.url,
);

describe("AU-4: sign-up auto sign-in redirect", () => {
  it("navigates through safeRedirectPath and refreshes after a successful sign-up", async () => {
    const source = await Bun.file(SIGNUP_FORM).text();

    expect(source).toContain(
      'searchParams.get("callbackUrl") || searchParams.get("redirect")',
    );
    expect(source).toContain("safeRedirectPath(");
    expect(source).toContain("router.push(asRoute(callbackUrl));");
    expect(source).toContain("router.refresh();");
  });
});
