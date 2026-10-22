import { afterEach, expect, it, mock } from "bun:test";

import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

mock.module("../../components/song-list/song-list.client", () => ({
  SongListClient: ({ items }: { items: { id: string }[] }) => (
    <output>{items.map((item) => item.id).join(",")}</output>
  ),
}));
const { EpisodeList } =
  await import("../../app/(root)/show/[name]/[season]/[token]/_components/episode-list");
let root: Root;
afterEach(async () => {
  await act(async () => root?.unmount());
  document.body.replaceChildren();
});

it("uses the new initial episode order when sort changes in the same query cache", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  const visit = (sort: "asc" | "desc") =>
    act(async () =>
      root.render(
        <EpisodeList
          showId="show-1"
          season={1}
          sort={sort}
          totalEpisodes={0}
          initialEpisodes={[toSongRow(rawSong({ id: sort }))]}
        />,
      ),
    );
  await visit("desc");
  expect(host.textContent).toBe("desc");
  await visit("asc");
  expect(host.textContent).toBe("asc");
  await visit("desc");
  expect(host.textContent).toBe("desc");
});
