import { describe, expect, it } from "bun:test";

import {
  getId,
  getKind,
  getSongs,
  getTitle,
  getVerified,
  isKind,
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
});

describe("toolbar title position", () => {
  const TOOLBAR = 56;

  it("counts the heading as under the toolbar only once it is fully above the bar", () => {
    expect(
      isTitleUnderToolbar(
        { isIntersecting: false, boundingClientRect: { top: -120 } },
        TOOLBAR,
      ),
    ).toBe(true);
  });

  it("keeps the heading in place while any of it is visible", () => {
    expect(
      isTitleUnderToolbar(
        { isIntersecting: true, boundingClientRect: { top: 20 } },
        TOOLBAR,
      ),
    ).toBe(false);
  });

  it("does not treat a heading below the fold as under the toolbar", () => {
    expect(
      isTitleUnderToolbar(
        { isIntersecting: false, boundingClientRect: { top: 900 } },
        TOOLBAR,
      ),
    ).toBe(false);
  });
});
