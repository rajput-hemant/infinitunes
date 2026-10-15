import { afterEach, describe, expect, it } from "bun:test";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";

import type { User } from "../../lib/auth";
import type { Viewer } from "../../lib/viewer-types";

const { ViewerProvider } = await import("../../components/viewer-context");
const { HomeGreeting } =
  await import("../../app/(root)/_components/home-greeting");

const roots: Root[] = [];

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
  document.body.innerHTML = "";
});

const viewerFor = (name: string | null): Promise<Viewer> =>
  Promise.resolve({
    user: name ? ({ name } as User) : undefined,
    playlists: undefined,
    favorites: undefined,
  });

async function mount(viewer: Promise<Viewer>) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () =>
    root.render(
      <ViewerProvider viewer={viewer}>
        <HomeGreeting />
      </ViewerProvider>,
    ),
  );
  return container;
}

describe("HomeGreeting", () => {
  it("serves the nameless fallback while the viewer is pending", () => {
    const html = renderToString(
      <ViewerProvider viewer={new Promise<Viewer>(() => {})}>
        <HomeGreeting />
      </ViewerProvider>,
    );
    expect(html).toContain(">Welcome<");
    expect(html).not.toContain("Ada");
  });

  it("greets by the client hour and the signed-in name", async () => {
    const container = await mount(viewerFor("Ada"));
    expect(container.querySelector("h1")?.textContent).toMatch(
      /^Good (morning|afternoon|evening), Ada$/,
    );
  });

  it("greets by the first name of a full name", async () => {
    const container = await mount(viewerFor("Local Developer"));
    expect(container.querySelector("h1")?.textContent).toMatch(
      /^Good (morning|afternoon|evening), Local$/,
    );
  });

  it("omits the name when signed out", async () => {
    const container = await mount(viewerFor(null));
    expect(container.querySelector("h1")?.textContent).toMatch(
      /^Good (morning|afternoon|evening)$/,
    );
  });
});
