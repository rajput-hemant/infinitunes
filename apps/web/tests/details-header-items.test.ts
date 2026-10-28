import { describe, expect, it } from "bun:test";

import { rawPlaylist } from "@infinitunes/types/fixtures";

import {
  canShuffle,
  getId,
  getKind,
  getSongs,
  getTitle,
  getVerified,
  isKind,
  isShowDetails,
  playlistMetaParts,
} from "../components/details-header/details-header-items";
import { isTitleUnderToolbar } from "../components/details-header/use-toolbar-art";
import {
  albumFixture,
  artistFixture,
  labelFixture,
  songFixture,
} from "./details-header-fixtures";

describe("details header items", () => {
  it("reads the kind from the raw type, or label for a label", () => {
    expect(getKind(songFixture())).toBe("song");
    expect(getKind(artistFixture())).toBe("artist");
    expect(getKind(labelFixture)).toBe("label");
  });

  it("recognises a show page's header whether the type says show or the older season", () => {
    for (const type of ["season", "show"]) {
      const item = Object.assign(albumFixture({ id: "63565" }), { type });
      expect(isShowDetails(item)).toBe(true);
      expect(getId(item)).toBe("63565");
    }
    expect(isShowDetails(albumFixture())).toBe(false);
    expect(isShowDetails(labelFixture)).toBe(false);
  });

  it("finds the id each shape keeps it under", () => {
    expect(getId(songFixture({ id: "s9" }))).toBe("s9");
    expect(getId(artistFixture())).toBe("a1");
    expect(getId(labelFixture)).toBe("l1");
  });

  it("decodes the title, falling back to name for artists and labels", () => {
    expect(getTitle(songFixture({ title: "Tum &amp; Me" }))).toBe("Tum & Me");
    expect(getTitle(artistFixture())).toBe("Tum & Me");
    expect(getTitle(labelFixture)).toBe("Label");
  });

  it("narrows to the requested raw type only", () => {
    const item = artistFixture();
    expect(isKind(item, "artist")).toBe(true);
    expect(isKind(item, "song")).toBe(false);
    expect(isKind(labelFixture, "artist")).toBe(false);
  });

  it("lists the song itself for a song page and the tracks of a list otherwise", () => {
    const song = songFixture();
    expect(getSongs(song)).toEqual([song]);

    const track = songFixture({ id: "t1" });
    expect(getSongs(albumFixture({ list: [track] }))).toEqual([track]);
    expect(getSongs(albumFixture({ list: "not-a-list" }))).toEqual([]);
    expect(getSongs(labelFixture)).toEqual([]);
  });

  it("reports verification only for items that carry it", () => {
    expect(getVerified(artistFixture())).toBe(true);
    expect(getVerified(albumFixture())).toBe(false);
  });

  it("offers shuffle for every page except a single song", () => {
    expect(canShuffle(songFixture())).toBe(false);
    expect(canShuffle(albumFixture())).toBe(true);
    expect(canShuffle(artistFixture())).toBe(true);
    expect(canShuffle(rawPlaylist())).toBe(true);
  });

  it("shows a playlist's fan count once, in its compact form", () => {
    const playlist = rawPlaylist({
      subtitle: "159.5K Fans",
      more_info: {
        ...rawPlaylist().more_info,
        subtitle_desc: ["3h 28m", "50 Songs", "159,534 Fans"],
      },
    });
    expect(playlistMetaParts(playlist)).toEqual([
      "159.5K Fans",
      "50 Songs",
      "3h 28m",
    ]);
  });

  it("keeps the one fan count when the subtitle has none", () => {
    const playlist = rawPlaylist({
      subtitle: "Editors Picks",
      more_info: {
        ...rawPlaylist().more_info,
        subtitle_desc: ["3h 28m", "50 Songs", "159,534 Fans"],
      },
    });
    expect(playlistMetaParts(playlist)).toEqual([
      "Editors Picks",
      "159,534 Fans",
      "50 Songs",
      "3h 28m",
    ]);
  });
});

describe("toolbar title position", () => {
  const TOOLBAR = 56;

  it("counts the heading as under the toolbar only once it is fully above the bar", () => {
    expect(
      isTitleUnderToolbar(
        {
          isIntersecting: false,
          boundingClientRect: { top: -120 } as DOMRectReadOnly,
        },
        TOOLBAR,
      ),
    ).toBe(true);
  });

  it("keeps the heading in place while any of it is visible", () => {
    expect(
      isTitleUnderToolbar(
        {
          isIntersecting: true,
          boundingClientRect: { top: 20 } as DOMRectReadOnly,
        },
        TOOLBAR,
      ),
    ).toBe(false);
  });

  it("does not treat a heading below the fold as under the toolbar", () => {
    expect(
      isTitleUnderToolbar(
        {
          isIntersecting: false,
          boundingClientRect: { top: 900 } as DOMRectReadOnly,
        },
        TOOLBAR,
      ),
    ).toBe(false);
  });
});
