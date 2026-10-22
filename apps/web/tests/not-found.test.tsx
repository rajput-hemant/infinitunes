import { describe, expect, test } from "bun:test";

import { renderToStaticMarkup } from "react-dom/server";

import RootNotFound from "../app/(root)/not-found";
import NotFound from "../app/not-found";

describe("not-found", () => {
  test("(root) and app-level variants share the 404 body", () => {
    const root = renderToStaticMarkup(<RootNotFound />);
    const app = renderToStaticMarkup(<NotFound />);
    for (const html of [root, app]) {
      expect(html).toContain("This page took a wrong turn");
      expect(html).not.toContain("8MT-LQlP35c_");
    }
    expect(app).toContain("min-h-dvh");
    expect(root).not.toContain("min-h-dvh");
  });
});
