import { render, screen, within } from "@testing-library/react-native";
import { Platform } from "react-native";

import { textStyles } from "~/theme/tokens";

import { LyricsSkeleton, ShelfSkeleton, SkeletonText } from "./skeletons";

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

  it("stays plain lines on iOS", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    await render(<LyricsSkeleton />);

    expect(screen.queryByTestId("lyrics-skeleton-card")).toBeNull();
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
