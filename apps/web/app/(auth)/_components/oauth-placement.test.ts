import { describe, expect, it } from "bun:test";

// REG-100: OAuth buttons must not be descendants of the credential <form>.
// The login/signup/reset forms are shared by the auth pages and the modal
// intercepts, so asserting on these three sources covers every route.
const FORMS = ["login-form.tsx", "signup-form.tsx", "reset-password-form.tsx"];

async function read(name: string) {
  return Bun.file(new URL(name, import.meta.url)).text();
}

describe("oauth buttons sit outside the credential form", () => {
  for (const form of FORMS) {
    it(`${form} renders <OAuthButtons> after </form>`, async () => {
      const src = await read(form);
      const formOpen = src.indexOf("<form");
      const formClose = src.indexOf("</form>");
      const oauth = src.indexOf("<OAuthButtons");

      expect(formOpen).toBeGreaterThanOrEqual(0);
      expect(oauth).toBeGreaterThanOrEqual(0);
      // One form per component, closed before the OAuth block starts.
      expect(formClose).toBeGreaterThan(formOpen);
      expect(oauth).toBeGreaterThan(formClose);
      expect(src.indexOf("</form>", formClose + 1)).toBe(-1);
    });
  }

  it("oauth-buttons.tsx buttons never submit a parent form", async () => {
    const src = await read("oauth-buttons.tsx");
    const buttons = src.match(/<Button[\s\S]*?>/g) ?? [];
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    for (const button of buttons) {
      expect(button).toContain('type="button"');
    }
  });
});
