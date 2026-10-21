import { act, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { preferencesStore } from "~/lib/preferences";

import { Artwork } from "./artwork";

const IMAGE = "https://c.saavncdn.com/845/Udta-Teer-150x150.jpg";

function renderedUri() {
  const { source } = screen.getByTestId("art").props;
  return Array.isArray(source) ? source[0]?.uri : source?.uri;
}

afterEach(() => preferencesStore.getState().setImageQuality("high"));

describe("Artwork", () => {
  it("loads the resolution the layout asks for", async () => {
    await render(
      <Artwork testID="art" image={IMAGE} quality="medium" style={{}} />,
    );
    expect(renderedUri()).toContain("-150x150.jpg");
  });

  it("takes its edge, radius and resolution from its size token", async () => {
    await render(<Artwork testID="art" image={IMAGE} size="row" />);
    expect(screen.getByTestId("art")).toHaveStyle({
      width: 48,
      height: 48,
      borderRadius: 6,
    });
    expect(renderedUri()).toContain("-150x150.jpg");
  });

  it("loads high resolution for large sizes and rounds round art", async () => {
    await render(<Artwork testID="art" image={IMAGE} size="header" round />);
    const { borderRadius } = StyleSheet.flatten(
      screen.getByTestId("art").props.style,
    );
    expect(screen.getByTestId("art")).toHaveStyle({ width: 240 });
    expect(borderRadius).toBeGreaterThanOrEqual(120);
    expect(renderedUri()).toContain("-500x500.jpg");
  });

  it("never loads more than the Image Quality setting allows", async () => {
    await render(
      <Artwork testID="art" image={IMAGE} quality="high" style={{}} />,
    );
    expect(renderedUri()).toContain("-500x500.jpg");

    await act(async () => preferencesStore.getState().setImageQuality("low"));
    expect(renderedUri()).toContain("-50x50.jpg");
  });
});
