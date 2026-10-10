import { afterEach, describe, expect, it, mock } from "bun:test";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";

let sessionName: string | null = "Ada";

mock.module("@infinitunes/auth/client", () => ({
  useSession: () => ({
    data: sessionName ? { user: { name: sessionName } } : null,
  }),
}));

const { HomeGreeting } =
  await import("../../app/(root)/_components/home-greeting");

const roots: Root[] = [];

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
  document.body.innerHTML = "";
  sessionName = "Ada";
});

describe("HomeGreeting", () => {
  it("serves a stable fallback that does not depend on the clock", () => {
    expect(renderToString(<HomeGreeting />)).toContain("Welcome, Ada");
    sessionName = null;
    const html = renderToString(<HomeGreeting />);
    expect(html).toContain(">Welcome<");
  });

  it("greets by the client hour and the signed-in name", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);
    await act(async () => root.render(<HomeGreeting />));

    const text = container.querySelector("h1")?.textContent ?? "";
    expect(text).toMatch(/^Good (morning|afternoon|evening), Ada$/);
  });

  it("greets by the first name of a full name", async () => {
    sessionName = "Local Developer";
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);
    await act(async () => root.render(<HomeGreeting />));

    expect(container.querySelector("h1")?.textContent).toMatch(
      /^Good (morning|afternoon|evening), Local$/,
    );
  });

  it("omits the name when signed out", async () => {
    sessionName = null;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);
    await act(async () => root.render(<HomeGreeting />));

    expect(container.querySelector("h1")?.textContent).toMatch(
      /^Good (morning|afternoon|evening)$/,
    );
  });
});
