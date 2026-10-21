import { render, screen } from "@testing-library/react-native";

import { textStyles } from "~/theme/tokens";

import { ShelfSkeleton, SkeletonText } from "./skeletons";

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
    await render(<ShelfSkeleton variant="hero" />);

    expect(screen.getAllByRole("progressbar")).toHaveLength(1);
  });
});
