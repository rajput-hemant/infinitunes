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

  it("takes a computed colour in place of the tone", async () => {
    await render(
      <Text tone="muted" color="#123456">
        On the wash
      </Text>,
    );
    const text = screen.getByText("On the wash");
    expect(text).toHaveStyle({ color: "#123456" });
    expect(text).not.toHaveProp(
      "className",
      expect.stringContaining("text-muted-foreground"),
    );
  });

  it("sets tabular figures for numbers", async () => {
    await render(<Text numeric>3:07</Text>);
    expect(screen.getByText("3:07")).toHaveStyle({
      fontVariant: ["tabular-nums"],
    });
  });

  it("carries the variant's tracking", async () => {
    jest.replaceProperty(textStyles, "caption", typeScale.android.caption);
    await render(<Text variant="caption">Album · 2007</Text>);
    expect(screen.getByText("Album · 2007")).toHaveStyle({
      letterSpacing: typeScale.android.caption.letterSpacing,
    });
    jest.restoreAllMocks();
  });

  it("draws an eyebrow in capitals and reads the text as given", async () => {
    await render(<Text uppercase>Album · 2007</Text>);
    const text = screen.getByText("Album · 2007");
    expect(text).toHaveStyle({ textTransform: "uppercase" });
    expect(text).toHaveProp("accessibilityLabel", "Album · 2007");
  });
});
