import { describe, expect, it } from "bun:test";

import { renderToStaticMarkup } from "react-dom/server";

import { UserAvatar, userInitial } from "../../components/user-avatar";

describe("userInitial", () => {
  it("uses the first letter of the name, upper-cased", () => {
    expect(userInitial({ name: "asha rao", email: "x@y.z" })).toBe("A");
  });

  it("falls back to the email, then to nothing", () => {
    expect(userInitial({ name: " ", email: "bo@y.z" })).toBe("B");
    expect(userInitial(undefined)).toBeNull();
  });
});

describe("UserAvatar", () => {
  it("renders the initial instead of the generic glyph", () => {
    const html = renderToStaticMarkup(
      <UserAvatar size="toolbar" user={{ name: "Asha" }} />,
    );
    expect(html).toContain(">A<");
    expect(html).not.toContain("<svg");
  });

  it("shows a glyph for a guest", () => {
    expect(renderToStaticMarkup(<UserAvatar size="menu" />)).toContain("<svg");
  });
});
