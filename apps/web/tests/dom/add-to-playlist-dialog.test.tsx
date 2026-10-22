import { describe, expect, it } from "bun:test";

import type { PlaylistSummary } from "@infinitunes/core/react/optimistic-playlists";
import { act } from "react";
import { createRoot } from "react-dom/client";

import { AddToPlaylistDialog } from "../../components/playlist/add-to-playlist-dialog";

describe("add to playlist dialog (UI-53)", () => {
  it.each([
    [0, "No songs"],
    [1, "1 song"],
    [3, "3 songs"],
  ] as const)(
    "shows a summary count of %i and preserves the full name",
    async (songCount, countLabel) => {
      const name = "x".repeat(100);
      const playlists: PlaylistSummary[] = [
        {
          id: "p1",
          name,
          description: null,
          songCount,
          coverSongs: [],
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
      expect(row?.textContent).toContain(countLabel);

      await act(async () => root.unmount());
    },
  );
});
