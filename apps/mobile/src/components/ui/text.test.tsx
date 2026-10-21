import { render, screen } from "@testing-library/react-native";
import { Platform } from "react-native";

import { textStyles, typeScale } from "~/theme/tokens";

import { Text } from "./text";

describe("Text", () => {
  it("uses this platform's scale", () => {
    expect(textStyles).toBe(
      Platform.OS === "ios" ? typeScale.ios : typeScale.android,
    );
  });

  it("renders in the body style by default", async () => {
    await render(<Text>Now playing</Text>);
    expect(screen.getByText("Now playing")).toHaveStyle(textStyles.body);
  });

  it("applies the requested variant", async () => {
    await render(<Text variant="title1">Udta Teer</Text>);
    expect(screen.getByText("Udta Teer")).toHaveStyle(textStyles.title1);
  });

  it("keeps the deprecated title as title2", async () => {
    await render(<Text variant="title">Trending</Text>);
    expect(screen.getByText("Trending")).toHaveStyle(textStyles.title2);
  });

  it("sets tabular figures for numbers", async () => {
    await render(<Text numeric>3:07</Text>);
    expect(screen.getByText("3:07")).toHaveStyle({
      fontVariant: ["tabular-nums"],
    });
  });
});
