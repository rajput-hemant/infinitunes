import { fireEvent, screen } from "@testing-library/react-native";

import { renderScreen } from "~/test/render";

import { SectionHeader } from "./section-header";
import { TEXT_BUTTON_HIT_SLOP } from "./ui/hit-slop";

describe("SectionHeader", () => {
  it("is a header with 24 above and 8 below", async () => {
    await renderScreen(<SectionHeader title="Quick picks" />);

    const header = screen.getByRole("header", { name: "Quick picks" });
    expect(header).toBeOnTheScreen();
    expect(header.parent?.props.className).toEqual(
      expect.stringContaining("pb-2 pt-6"),
    );
  });

  it("links its action when it has an href", async () => {
    const app = await renderScreen(
      <SectionHeader
        title="New Releases"
        action={{ label: "See All", href: "/search" }}
      />,
      { routes: { search: () => null } },
    );

    const link = screen.getByRole("link", { name: "See All New Releases" });
    expect(link).toHaveProp("hitSlop", TEXT_BUTTON_HIT_SLOP);
    await fireEvent.press(link);

    expect(app.getPathname()).toBe("/search");
  });

  it("is a button when its action has onPress", async () => {
    const onPress = jest.fn();
    await renderScreen(
      <SectionHeader
        title="Recent searches"
        action={{
          label: "Clear",
          onPress,
          accessibilityLabel: "Clear recent searches",
        }}
      />,
    );

    await fireEvent.press(
      screen.getByRole("button", { name: "Clear recent searches" }),
    );

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
