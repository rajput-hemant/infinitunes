import { describe, expect, it } from "bun:test";

const LOGIN_FORM = new URL(
  "../app/(auth)/_components/login-form.tsx",
  import.meta.url,
);

describe("ISSUE-023: email login form post-success redirect regression", () => {
  it("login-form navigates on successful email sign in and passkey sign in", async () => {
    const source = await Bun.file(LOGIN_FORM).text();

    expect(source).toContain("useRouter");
    expect(source).toContain("const router = useRouter();");
    expect(source).toContain(
      'searchParams.get("callbackUrl") || searchParams.get("redirect")',
    );
    expect(source).toContain("safeRedirectPath(");
    expect(source).toContain("router.push(asRoute(callbackUrl));");
    expect(source).toContain("router.refresh();");
  });
});
