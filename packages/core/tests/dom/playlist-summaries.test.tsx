import { afterEach, expect, it } from "bun:test";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import {
  addSongsOptimistic,
  resetPlaylistOverlay,
  usePlaylists,
} from "../../src/react/optimistic-playlists";

const roots: Root[] = [];
afterEach(async () => {
  await act(async () => roots.splice(0).forEach((root) => root.unmount()));
  resetPlaylistOverlay();
});

it("shares summary snapshots between readers and counts only new songs", async () => {
  const server = [{ id: "p", name: "P", description: null, createdAt: new Date(0), songCount: 1 }];
  const snapshots: unknown[] = [];
  function Probe() {
    const playlists = usePlaylists(server);
    snapshots.push(playlists);
    return <output>{playlists?.[0]?.songCount}</output>;
  }
  const host = document.createElement("div");
  const root = createRoot(host);
  roots.push(root);
  await act(async () => root.render(<><Probe /><Probe /></>));
  expect(snapshots[0]).toBe(snapshots[1]);
  await act(async () => {
    void addSongsOptimistic("p", ["old", "new", "new"], () => new Promise(() => {}), ["old"]);
  });
  expect(host.textContent).toBe("22");
});
