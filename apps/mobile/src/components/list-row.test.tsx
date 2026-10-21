import { fireEvent, screen } from "@testing-library/react-native";

import { renderScreen } from "~/test/render";

import { ListRow } from "./list-row";
import { IconButton } from "./ui/icon-button";

describe("ListRow", () => {
  it("is a link named by its title and subtitle", async () => {
    const app = await renderScreen(
      <ListRow
        title="Udta Teer"
        subtitle="Album"
        leading={{ artwork: "https://c.saavncdn.com/a-150x150.jpg" }}
        href="/album/udta-teer/abc"
      />,
      { routes: { "album/[name]/[token]": () => null } },
    );

    await fireEvent.press(
      screen.getByRole("link", { name: "Udta Teer, Album" }),
    );

    expect(app.getPathname()).toBe("/album/udta-teer/abc");
  });

  it("is a button with onPress, its trailing controls reachable beside it", async () => {
    const onPress = jest.fn();
    const onLike = jest.fn();
    await renderScreen(
      <ListRow
        title="Recent"
        leading={{ icon: { ios: "clock", android: "history" } }}
        onPress={onPress}
        trailing={
          <IconButton
            icon={{ ios: "heart", android: "favorite_border" }}
            label="Like Recent"
            onPress={onLike}
          />
        }
      />,
    );

    await fireEvent.press(screen.getByRole("button", { name: "Recent" }));
    await fireEvent.press(screen.getByRole("button", { name: "Like Recent" }));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onLike).toHaveBeenCalledTimes(1);
  });

  it("is a dimmed labelled view, not a disabled button, without a destination", async () => {
    await renderScreen(<ListRow title="Pending" subtitle="Creating" />);

    expect(screen.queryByRole("button")).toBeNull();
    const row = screen.getByLabelText("Pending, Creating");
    expect(row).toHaveProp("className", expect.stringContaining("opacity-50"));
  });

  it("is a checkbox when it is one choice of many", async () => {
    const onPress = jest.fn();
    await renderScreen(<ListRow title="Hindi" checked onPress={onPress} />);

    const row = screen.getByRole("checkbox", { name: "Hindi" });
    expect(row).toBeChecked();
    await fireEvent.press(row);

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("numbers a track", async () => {
    await renderScreen(
      <ListRow title="Song" leading={{ index: 3 }} onPress={jest.fn()} />,
    );

    expect(screen.getByText("3")).toBeOnTheScreen();
    expect(screen.queryByTestId("now-playing")).toBeNull();
  });

  it("shows the waveform in place of the number while current", async () => {
    await renderScreen(
      <ListRow
        title="Song"
        leading={{ index: 3 }}
        onPress={jest.fn()}
        selected
      />,
    );

    expect(screen.queryByText("3")).toBeNull();
    expect(screen.getByTestId("now-playing")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Song" })).toBeSelected();
  });

  it("names the explicit mark and leads the subtitle with it", async () => {
    await renderScreen(
      <ListRow title="Song" subtitle="Artist" explicit onPress={jest.fn()} />,
    );

    expect(
      screen.getByRole("button", { name: "Song, Explicit, Artist" }),
    ).toBeOnTheScreen();
    expect(screen.getByText("E")).toBeOnTheScreen();
  });

  it("keeps the 64pt minimum and grows with Dynamic Type", async () => {
    await renderScreen(<ListRow title="Song" onPress={jest.fn()} />);

    const className: string = screen.getByRole("button", { name: "Song" }).props
      .className;
    expect(className).toContain("min-h-row");
    expect(className).not.toMatch(/(^| )h-/);
  });
});
