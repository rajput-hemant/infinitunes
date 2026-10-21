import { act, render, screen } from "@testing-library/react-native";

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

  it("never loads more than the Image Quality setting allows", async () => {
    await render(
      <Artwork testID="art" image={IMAGE} quality="high" style={{}} />,
    );
    expect(renderedUri()).toContain("-500x500.jpg");

    await act(async () => preferencesStore.getState().setImageQuality("low"));
    expect(renderedUri()).toContain("-50x50.jpg");
  });
});
