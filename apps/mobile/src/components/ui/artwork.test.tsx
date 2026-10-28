import { act, render, screen } from "@testing-library/react-native";
import { Dimensions, PixelRatio, StyleSheet } from "react-native";

import { preferencesStore } from "~/lib/preferences";
import { art } from "~/theme/tokens";

import { Artwork } from "./artwork";

const IMAGE = "https://c.saavncdn.com/845/Udta-Teer-150x150.jpg";

function renderedUri(testID = "art") {
  const { source } = screen.getByTestId(testID).props;
  return typeof source === "string"
    ? source
    : Array.isArray(source)
      ? source[0]?.uri
      : source?.uri;
}

afterEach(() => preferencesStore.getState().setImageQuality("high"));

describe("Artwork", () => {
  it("does not subscribe fixed-size cells to window changes", async () => {
    const listen = jest.spyOn(Dimensions, "addEventListener");
    try {
      await render(
        <>
          <Artwork image={IMAGE} size="row" />
          <Artwork image={IMAGE} size="card" />
        </>,
      );
      expect(listen).not.toHaveBeenCalled();
    } finally {
      listen.mockRestore();
    }
  });

  it("keeps player artwork responsive to window changes", async () => {
    const window = Dimensions.get("window");
    try {
      await render(<Artwork testID="art" image={IMAGE} size="player" />);
      expect(screen.getByTestId("art")).toHaveStyle({ width: 342 });
      await act(async () => {
        Dimensions.set({ window: { ...window, width: 320 } });
      });
      expect(screen.getByTestId("art")).toHaveStyle({ width: 272 });
    } finally {
      await act(async () => Dimensions.set({ window }));
    }
  });

  it("loads the resolution the layout asks for", async () => {
    await render(
      <Artwork testID="art" image={IMAGE} size="card" quality="medium" />,
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

  it("swaps list cell art at once, without a fade", async () => {
    await render(
      <>
        <Artwork testID="row" image={IMAGE} size="row" />
        <Artwork testID="card" image={IMAGE} size="card" />
        <Artwork testID="header" image={IMAGE} size="header" />
      </>,
    );
    expect(screen.getByTestId("row").props.transition).toEqual({ duration: 0 });
    expect(screen.getByTestId("card").props.transition).toEqual({
      duration: 0,
    });
    expect(screen.getByTestId("header").props.transition).toEqual({
      duration: 150,
    });
  });

  it("loads high resolution for large sizes and rounds round art", async () => {
    await render(<Artwork testID="art" image={IMAGE} size="header" round />);
    const { borderRadius } = StyleSheet.flatten(
      screen.getByTestId("art").props.style,
    );
    expect(screen.getByTestId("art")).toHaveStyle({ width: art.header });
    expect(borderRadius).toBeGreaterThanOrEqual(100);
    expect(renderedUri()).toContain("-500x500.jpg");
  });

  it("loads 500px once the art's physical pixels outgrow the 150px picture", async () => {
    // A Samsung at 2.8125x: a 56pt tile is 158 physical pixels, a 48pt row 135.
    const get = jest.spyOn(PixelRatio, "get").mockReturnValue(2.8125);
    try {
      await render(
        <>
          <Artwork testID="tile" image={IMAGE} size="tile" />
          <Artwork testID="row" image={IMAGE} size="row" />
        </>,
      );
      expect(renderedUri("tile")).toContain("-500x500.jpg");
      expect(renderedUri("row")).toContain("-150x150.jpg");
    } finally {
      get.mockRestore();
    }
  });

  it("never loads more than the Image Quality setting allows", async () => {
    await render(<Artwork testID="art" image={IMAGE} size="card" />);
    expect(renderedUri()).toContain("-500x500.jpg");

    await act(async () => preferencesStore.getState().setImageQuality("low"));
    expect(renderedUri()).toContain("-50x50.jpg");
  });
});
