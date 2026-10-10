import { describe, expect, it, mock } from "bun:test";

import type { Song } from "@infinitunes/types";
import { renderToStaticMarkup } from "react-dom/server";

mock.module("server-only", () => ({}));
mock.module("~/components/download-button", () => ({
  DownloadButton: () => null,
}));
const likeProps: { className?: string }[] = [];
mock.module("~/components/like-button", () => ({
  LikeButton: (props: { className?: string }) => {
    likeProps.push(props);
    return null;
  },
}));
mock.module("~/components/play-button", () => ({ PlayButton: () => null }));
let menuRows = 0;
mock.module("~/components/song-list/more-button", () => ({
  TileMoreButton: () => {
    menuRows += 1;
    return null;
  },
}));
mock.module("~/components/song-list/play-pause-button", () => ({
  TilePlayPauseButton: () => null,
}));

const { SongListClient } =
  await import("../../components/song-list/song-list.client");

const song = {
  id: "s1",
  type: "song",
  title: "Title",
  subtitle: "Sub",
  perma_url: "https://www.jiosaavn.com/song/t/AbCdEfGh",
  image: "https://c.saavncdn.com/001/x-150x150.jpg",
  more_info: { duration: "180", artistMap: { primary_artists: [] } },
} as unknown as Song;

describe("row Like button on mobile", () => {
  it("is hidden below lg because the row menu carries the favourite action", () => {
    likeProps.length = 0;
    menuRows = 0;
    renderToStaticMarkup(<SongListClient items={[song]} />);

    const classes = (likeProps[0]?.className ?? "").split(" ");
    expect(classes).toContain("hidden");
    expect(classes).toContain("lg:inline-flex");
    expect(classes).not.toContain("lg:block");
    expect(menuRows).toBe(1);
  });
});
