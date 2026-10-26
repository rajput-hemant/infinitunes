import { afterEach, describe, expect, it, mock } from "bun:test";

import type { PlaylistSummary } from "@infinitunes/core/react/optimistic-playlists";
import {
  AppRouterContext,
  type AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import type { Viewer } from "../../lib/viewer-types";

// Action modules behind the playlist form import `server-only`.
mock.module("server-only", () => ({}));
// No App Router layout tree is mounted, so the segment hook returns null.
const navigation = await import("next/navigation");
mock.module("next/navigation", () => ({
  ...navigation,
  useSelectedLayoutSegments: () => [],
}));
const { AppSidebarProvider } = await import("../../components/sidebar");
const { ViewerProvider, ViewerSidebar, ViewerSignedOut, ViewerMobileNav } =
  await import("../../components/viewer");

const roots: Root[] = [];
const router: AppRouterInstance = {
  back() {},
  forward() {},
  refresh() {},
  push() {},
  replace() {},
  prefetch() {},
  bfcacheId: "0",
};

async function mount(ui: React.ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(
      <AppRouterContext.Provider value={router}>
        {ui}
      </AppRouterContext.Provider>,
    );
  });
}

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
  document.body.replaceChildren();
  document.cookie = "sidebar_state=; path=/; max-age=0";
  delete document.documentElement.dataset.sidebar;
  delete document.documentElement.dataset.sidebarReady;
});

const text = () => document.body.textContent ?? "";

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

const signedIn: Viewer = {
  user: { id: "u1", name: "U", email: "u@x.dev", image: null },
  playlists: [
    {
      id: "p1",
      name: "Road trip",
      description: null,
      songCount: 0,
      coverSongs: [],
      createdAt: new Date(0),
    } satisfies PlaylistSummary,
  ],
  favorites: null,
};

describe("viewer islands", () => {
  it("renders the sidebar frame at once and fills the library when the viewer resolves", async () => {
    const viewer = deferred<Viewer>();
    await mount(
      <ViewerProvider viewer={viewer.promise}>
        <AppSidebarProvider>
          <ViewerSidebar />
        </AppSidebarProvider>
      </ViewerProvider>,
    );

    // The browse links are static; the library part is a placeholder, not the
    // signed-out prompt, so a signed-in visitor never sees a wrong state.
    expect(text()).toContain("Top Albums");
    expect(text()).not.toContain("You need to be logged in");
    expect(text()).not.toContain("Road trip");

    await act(async () => viewer.resolve(signedIn));

    expect(text()).toContain("Road trip");
    expect(text()).toContain("Library");
  });

  it("shows the signed-out prompt once the viewer resolves without a user", async () => {
    await mount(
      <ViewerProvider
        viewer={Promise.resolve({
          user: undefined,
          playlists: undefined,
          favorites: undefined,
        })}
      >
        <AppSidebarProvider>
          <ViewerSidebar />
        </AppSidebarProvider>
      </ViewerProvider>,
    );

    expect(text()).toContain("You need to be logged in");
  });

  it("renders the Log in button only for a signed-out visitor, and nothing while unknown", async () => {
    const viewer = deferred<Viewer>();
    await mount(
      <ViewerProvider viewer={viewer.promise}>
        <ViewerSignedOut>
          <button type="button">Log in</button>
        </ViewerSignedOut>
      </ViewerProvider>,
    );
    expect(text()).not.toContain("Log in");

    await act(async () => viewer.resolve(signedIn));
    expect(text()).not.toContain("Log in");

    await mount(
      <ViewerProvider
        viewer={Promise.resolve({
          user: undefined,
          playlists: undefined,
          favorites: undefined,
        })}
      >
        <ViewerSignedOut>
          <button type="button">Log in</button>
        </ViewerSignedOut>
      </ViewerProvider>,
    );
    expect(text()).toContain("Log in");
  });

  it("keeps a placeholder in the last tab until the session is known", async () => {
    const viewer = deferred<Viewer>();
    await mount(
      <ViewerProvider viewer={viewer.promise}>
        <AppSidebarProvider>
          <ViewerMobileNav />
        </AppSidebarProvider>
      </ViewerProvider>,
    );
    expect(text()).not.toContain("Login");
    expect(text()).not.toContain("Settings");

    await act(async () => viewer.resolve(signedIn));
    expect(text()).toContain("Settings");
  });
});

const emptyViewer = Promise.resolve<Viewer>({
  user: undefined,
  playlists: undefined,
  favorites: undefined,
});

describe("collapsed sidebar flag", () => {
  const sidebarState = () =>
    document.querySelector("[data-slot=sidebar]")?.getAttribute("data-state");

  it("renders open when nothing is saved", async () => {
    await mount(
      <ViewerProvider viewer={emptyViewer}>
        <AppSidebarProvider>
          <ViewerSidebar />
        </AppSidebarProvider>
      </ViewerProvider>,
    );

    expect(sidebarState()).toBe("expanded");
  });

  it("applies the saved collapsed state on hydration and ends the CSS stand-in", async () => {
    document.documentElement.dataset.sidebar = "collapsed";
    await mount(
      <ViewerProvider viewer={emptyViewer}>
        <AppSidebarProvider>
          <ViewerSidebar />
        </AppSidebarProvider>
      </ViewerProvider>,
    );

    expect(document.documentElement.dataset.sidebarReady).toBe("");
    expect(sidebarState()).toBe("collapsed");
  });
});
