import { describe, expect, it, mock } from "bun:test";

import type { Song } from "@infinitunes/types";
import { renderToStaticMarkup } from "react-dom/server";

mock.module("server-only", () => ({}));
// The row chrome pulls in player/tRPC context; only the text under test matters.
mock.module("~/components/download-button", () => ({
  DownloadButton: () => null,
}));
mock.module("~/components/like-button", () => ({ LikeButton: () => null }));
mock.module("~/components/play-button", () => ({ PlayButton: () => null }));
mock.module("~/components/song-list/more-button", () => ({
  TileMoreButton: () => null,
}));
mock.module("~/components/song-list/play-pause-button", () => ({
  TilePlayPauseButton: () => null,
}));

const { SongListClient } =
  await import("../../components/song-list/song-list.client");

const song = {
  id: "s1",
  type: "song",
  title: "Rock &amp; Roll",
  subtitle: "Kurt Sanderling &amp; Berliner Symphoniker",
  perma_url: "https://www.jiosaavn.com/song/rock-roll/AbCdEfGh",
  image: "https://c.saavncdn.com/001/x-150x150.jpg",
  more_info: {
    album: "Black &amp; White",
    album_url: "https://www.jiosaavn.com/album/bw/1234",
    duration: "180",
    artistMap: {
      primary_artists: [
        {
          id: "a1",
          name: "Simon &amp; Garfunkel",
          perma_url: "https://www.jiosaavn.com/artist/sg/xyz",
        },
      ],
    },
  },
} as unknown as Song;

describe("D2: song rows decode HTML entities", () => {
  it("never renders a literal &amp; for title, artist or album", () => {
    const html = renderToStaticMarkup(<SongListClient items={[song]} />);
    expect(html).not.toContain("&amp;amp;");
    expect(html).toContain("Rock &amp; Roll");
    expect(html).toContain("Simon &amp; Garfunkel");
    expect(html).toContain("Black &amp; White");
  });
});
