import { render, screen, within } from "@testing-library/react-native";
import { Platform } from "react-native";

import { renderScreen } from "~/test/render";
import { signInAs } from "~/test/session-mock";
import { textStyles } from "~/theme/tokens";

import {
  EntityHeaderSkeleton,
  LyricsSkeleton,
  MediaListSkeleton,
  ShelfSkeleton,
  SkeletonText,
  SongListSkeleton,
} from "./skeletons";

describe("SongListSkeleton", () => {
  it("ends each row with the menu's cell, and the heart for a signed-in listener", async () => {
    await renderScreen(<SongListSkeleton rows={3} />);
    expect(screen.getAllByTestId("row-skeleton-menu")).toHaveLength(3);
    expect(screen.queryByTestId("row-skeleton-like")).toBeNull();
  });

  it("draws the heart cell on every row once signed in", async () => {
    signInAs("user-1");
    await renderScreen(<SongListSkeleton rows={3} numbered />);
    expect(screen.getAllByTestId("row-skeleton-like")).toHaveLength(3);
    expect(screen.getAllByTestId("row-skeleton-menu")).toHaveLength(3);
  });
});

it("draws playlist rows with a menu and no song favourite", async () => {
  signInAs("user-1");
  await renderScreen(<MediaListSkeleton rows={3} menu />);
  expect(screen.getAllByTestId("media-skeleton-row")).toHaveLength(3);
  expect(screen.getAllByTestId("media-skeleton-menu")).toHaveLength(3);
  expect(screen.queryByTestId("row-skeleton-like")).toBeNull();
});

describe("LyricsSkeleton", () => {
  afterEach(() => jest.restoreAllMocks());

  it("mirrors Android's lyrics card: four headline lines and Read More", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    await render(<LyricsSkeleton />);

    const card = screen.getByTestId("lyrics-skeleton-card");
    const lines = within(card).getAllByTestId("skeleton-text");
    expect(lines.map((line) => line.props.style.height)).toEqual([
      ...Array.from({ length: 4 }, () => textStyles.headline.lineHeight),
      textStyles.label.lineHeight,
    ]);
  });

  it("mirrors iOS's plain preview: three body lines and Read More", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    await render(<LyricsSkeleton />);

    expect(screen.queryByTestId("lyrics-skeleton-card")).toBeNull();
    const preview = screen.getByTestId("lyrics-skeleton-plain");
    const lines = within(preview).getAllByTestId("skeleton-text");
    expect(lines.map((line) => line.props.style.height)).toEqual([
      ...Array.from({ length: 3 }, () => textStyles.body.lineHeight),
      textStyles.subhead.lineHeight,
    ]);
  });
});

describe("EntityHeaderSkeleton", () => {
  it("mirrors the action row: Shuffle, a hugging Play capsule, Download (signed out too)", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    await renderScreen(<EntityHeaderSkeleton />);
    expect(screen.getByTestId("header-skeleton-shuffle")).toBeOnTheScreen();
    expect(
      screen.getByTestId("header-skeleton-play").props.className,
    ).not.toContain("flex-1");
    expect(screen.getByTestId("header-skeleton-download")).toBeOnTheScreen();
    // The options moved to the native bar: no dots in the row.
    expect(screen.queryByTestId("header-skeleton-menu")).toBeNull();
  });

  it("mirrors Android's row: Shuffle's icon and the 56dp Play at the trailing edge", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    await renderScreen(<EntityHeaderSkeleton />);
    expect(
      screen.getByTestId("header-skeleton-shuffle").props.className,
    ).toContain("size-ctl");
    expect(
      screen.getByTestId("header-skeleton-play").props.className,
    ).toContain("size-row");
    expect(screen.queryByTestId("header-skeleton-download")).toBeNull();
  });

  it("leaves out the buttons the loaded header will not have", async () => {
    await renderScreen(
      <EntityHeaderSkeleton download={false} shuffle={false} />,
    );
    expect(screen.queryByTestId("header-skeleton-shuffle")).toBeNull();
    expect(screen.queryByTestId("header-skeleton-download")).toBeNull();
    expect(screen.getByTestId("header-skeleton-play")).toBeOnTheScreen();
  });
});

describe("SkeletonText", () => {
  it("takes its line's height, with a bar the height of its font", async () => {
    await render(<SkeletonText variant="title1" width="60%" />);

    const line = screen.getByTestId("skeleton-text");
    expect(line).toHaveStyle({
      height: textStyles.title1.lineHeight,
      width: "60%",
    });
    expect(line.children[0]).toHaveStyle({
      height: textStyles.title1.fontSize,
    });
  });
});

describe("ShelfSkeleton", () => {
  it("is one loading indicator", async () => {
    await render(<ShelfSkeleton />);

    expect(screen.getAllByRole("progressbar")).toHaveLength(1);
  });
});
