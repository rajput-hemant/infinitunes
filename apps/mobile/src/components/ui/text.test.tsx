import { render, screen } from "@testing-library/react-native";
import { Platform } from "react-native";

import { typeScale } from "~/theme/tokens";

import { Text } from "./text";

const scale = Platform.OS === "ios" ? typeScale.ios : typeScale.android;

describe("Text", () => {
  it("renders in the body style by default", async () => {
    await render(<Text>Now playing</Text>);
    expect(screen.getByText("Now playing")).toHaveStyle(scale.body);
  });

  it("applies the requested variant", async () => {
    await render(<Text variant="title">Trending</Text>);
    expect(screen.getByText("Trending")).toHaveStyle(scale.title);
  });
});
