import { render, screen, within } from "@testing-library/react-native";
import { Platform } from "react-native";

import { renderScreen } from "~/test/render";
import { textStyles } from "~/theme/tokens";

import {
  EntityHeaderSkeleton,
  LyricsSkeleton,
  ShelfSkeleton,
  SkeletonText,
} from "./skeletons";

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
  it("draws the menu's dots where the loaded header has its menu", async () => {
    await renderScreen(<EntityHeaderSkeleton like={false} />);
    expect(screen.getByTestId("header-skeleton-menu")).toBeOnTheScreen();
    expect(screen.queryByTestId("header-skeleton-like")).toBeNull();
  });

  it("leaves the menu out of a header without one", async () => {
    await renderScreen(<EntityHeaderSkeleton menu={false} />);
    expect(screen.queryByTestId("header-skeleton-menu")).toBeNull();
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
