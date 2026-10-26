import { screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { renderWithProviders } from "~/test/render";

import { ContextPreview, useContextPreviewSize } from "./context-preview";

function Heights() {
  const bare = useContextPreviewSize({ image: "x", title: "t" });
  const full = useContextPreviewSize({
    image: "x",
    title: "t",
    subtitle: "s",
    caption: "c",
  });
  return <Text testID="heights">{`${bare.height},${full.height}`}</Text>;
}

describe("ContextPreview", () => {
  it("shows the art, title, credit and album on an opaque card", async () => {
    await renderWithProviders(
      <ContextPreview
        image="https://c.saavncdn.com/a-500x500.jpg"
        title="FA9LA & Friends"
        subtitle="Flipperachi"
        caption="Single"
      />,
    );

    expect(screen.getByText("FA9LA & Friends")).toBeOnTheScreen();
    expect(screen.getByText("Flipperachi")).toBeOnTheScreen();
    expect(screen.getByText("Single")).toBeOnTheScreen();
    expect(screen.getByTestId("context-preview")).toHaveProp(
      "className",
      expect.stringContaining("bg-card"),
    );
  });

  it("is sized from its content: a line more for each text", async () => {
    await renderWithProviders(<Heights />);

    const [bare, full] = String(
      screen.getByTestId("heights").props.children,
    ).split(",");
    expect(Number(full)).toBeGreaterThan(Number(bare));
  });
});
