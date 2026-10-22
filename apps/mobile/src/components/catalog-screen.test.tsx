import { screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { renderScreen } from "~/test/render";

import { CatalogScreen } from "./catalog-screen";
import { CONTENT_CONCEAL } from "./skeletons";

const query = (over: object) => ({
  items: [] as string[],
  isPending: false,
  error: null,
  refetch: async () => undefined,
  ...over,
});

const renderCatalog = (over: object) =>
  renderScreen(
    <CatalogScreen
      query={query(over)}
      keyOf={(item) => item}
      renderCard={(item) => <Text>{item}</Text>}
      empty={{
        icon: { ios: "music.note", android: "music_note" },
        title: "None",
      }}
    />,
  );

describe("CatalogScreen", () => {
  it("fades the skeleton out so it crossfades with the cards", async () => {
    await renderCatalog({ isPending: true });
    const skeleton = screen.getByTestId("catalog-skeleton");
    expect(skeleton.props.exiting).toBe(CONTENT_CONCEAL);
  });

  it("shows the cards once loaded, with no skeleton", async () => {
    await renderCatalog({ items: ["a", "b"] });
    expect(screen.getByText("a")).toBeTruthy();
    expect(screen.queryByTestId("catalog-skeleton")).toBeNull();
  });
});
