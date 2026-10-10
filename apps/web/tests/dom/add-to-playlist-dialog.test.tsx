import { describe, expect, it } from "bun:test";

import type { MyPlaylist } from "@infinitunes/db/schema";
import { act } from "react";
import { createRoot } from "react-dom/client";

import { AddToPlaylistDialog } from "../../components/playlist/add-to-playlist-dialog";

describe("add to playlist dialog (UI-53)", () => {
  it("keeps the icon box from shrinking and exposes the full name", async () => {
    const name = "x".repeat(100);
    const playlists: MyPlaylist[] = [
      {
        id: "p1",
        name,
        description: null,
        userId: "u1",
        songs: [],
        createdAt: new Date(0),
      },
    ];

    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <AddToPlaylistDialog
          isDialogOpen
          setDialogOpen={() => {}}
          playlists={playlists}
          addToPlaylist={() => {}}
        />,
      );
    });

    const label = document.querySelector(`[title="${name}"]`);
    expect(label).not.toBeNull();
    const row = label?.closest("button");
    const iconBox = row?.querySelector("div");
    expect(iconBox?.className.split(" ")).toContain("shrink-0");

    await act(async () => root.unmount());
  });
});
