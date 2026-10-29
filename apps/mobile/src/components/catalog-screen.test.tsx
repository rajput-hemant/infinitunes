import { screen } from "@testing-library/react-native";
import { Platform, Text } from "react-native";

import { installedScrimOpacity } from "~/test/bar-scrim";
import { renderScreen, scrollListTo } from "~/test/render";

import { CatalogScreen } from "./catalog-screen";
import { CONTENT_CONCEAL } from "./skeletons";

const mockSetOptions = jest.fn();
jest.mock("expo-router", () => ({
  ...jest.requireActual("expo-router"),
  useNavigation: () => ({ setOptions: mockSetOptions }),
}));

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

  it("fades the Android bar scrim in once the grid scrolls under it", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    mockSetOptions.mockClear();
    await renderCatalog({ items: ["a", "b"] });
    await scrollListTo("a", 40);
    expect(await installedScrimOpacity(mockSetOptions)).toBe(1);
  });
});
