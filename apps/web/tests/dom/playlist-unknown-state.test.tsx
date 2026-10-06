import { afterEach, describe, expect, it, mock } from "bun:test";

import type { MyPlaylist } from "@infinitunes/db/schema";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import type { User } from "../../lib/auth";

// Action modules behind the playlist form import `server-only`.
mock.module("server-only", () => ({}));
// No App Router layout tree is mounted, so the segment hook returns null.
const navigation = await import("next/navigation");
mock.module("next/navigation", () => ({
  ...navigation,
  useSelectedLayoutSegments: () => [],
}));
const { AppSidebarProvider, Sidebar } =
  await import("../../components/sidebar");
const { AddToPlaylistDialog } =
  await import("../../components/playlist/add-to-playlist-dialog");

const user = { id: "u1", name: "U", email: "u@x.dev" } as unknown as User;
const roots: Root[] = [];

async function mount(ui: React.ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(
      <AppRouterContext.Provider value={{} as never}>
        {ui}
      </AppRouterContext.Provider>,
    );
  });
}

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
  document.body.replaceChildren();
});

const text = () => document.body.textContent ?? "";
const playlist = (id: string, name: string) =>
  ({ id, name, songs: [] }) as unknown as MyPlaylist;

function dialog(playlists: MyPlaylist[] | undefined) {
  return (
    <AddToPlaylistDialog
      user={user}
      isDialogOpen
      setDialogOpen={() => {}}
      playlists={playlists}
      addToPlaylist={() => {}}
    />
  );
}

function sidebar(userPlaylists: MyPlaylist[] | undefined) {
  return (
    <AppSidebarProvider>
      <Sidebar user={user} userPlaylists={userPlaylists} />
    </AppSidebarProvider>
  );
}

describe("AddToPlaylistDialog library states", () => {
  it("shows a load error, not the empty state, when playlists are unknown", async () => {
    await mount(dialog(undefined));

    expect(text()).toContain("Couldn't load your playlists");
    expect(text()).not.toContain("No playlists yet");
    expect(text()).toContain("Create New Playlist");
  });

  it("shows the empty state for a loaded empty library", async () => {
    await mount(dialog([]));

    expect(text()).toContain("No playlists yet");
    expect(text()).not.toContain("Couldn't load");
  });

  it("lists loaded playlists", async () => {
    await mount(dialog([playlist("1", "Road trip")]));

    expect(text()).toContain("Road trip");
  });
});

describe("Sidebar library states", () => {
  it("keeps the create CTA and notes the failure when playlists are unknown", async () => {
    await mount(sidebar(undefined));

    expect(text()).toContain("Couldn't load your playlists");
    expect(text()).toContain("Create Playlist");
  });

  it("shows the create CTA without a note for an empty library", async () => {
    await mount(sidebar([]));

    expect(text()).toContain("Create Playlist");
    expect(text()).not.toContain("Couldn't load");
  });

  it("lists playlists without the CTA when some exist", async () => {
    await mount(sidebar([playlist("1", "Road trip")]));

    expect(text()).toContain("Road trip");
    expect(text()).not.toContain("Couldn't load");
  });
});
