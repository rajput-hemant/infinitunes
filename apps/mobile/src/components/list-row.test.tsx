import { rawAlbum } from "@infinitunes/types/fixtures";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Platform, StyleSheet } from "react-native";

import { renderScreen } from "~/test/render";
import { titleLineTexts } from "~/test/title-row";
import { procedure } from "~/test/trpc-mock";
import { space } from "~/theme/tokens";

import { ListRow } from "./list-row";
import { IconButton } from "./ui/icon-button";

describe("ListRow", () => {
  it("prefetches the screen of its entity when pressed in, and only then", async () => {
    procedure("album.details").mockResolvedValue(rawAlbum());
    await renderScreen(
      <>
        <ListRow
          title="Udta Teer"
          href="/album/udta-teer/abc"
          entity={{
            type: "album",
            url: "https://www.jiosaavn.com/album/udta-teer/abc",
          }}
        />
        <ListRow title="Plain" onPress={() => {}} />
      </>,
      { routes: { "album/[name]/[token]": () => null } },
    );

    await fireEvent(screen.getByRole("button", { name: "Plain" }), "pressIn");
    expect(procedure("album.details")).not.toHaveBeenCalled();

    await fireEvent(screen.getByRole("link", { name: "Udta Teer" }), "pressIn");
    await waitFor(() =>
      expect(procedure("album.details")).toHaveBeenCalledWith({ token: "abc" }),
    );
  });

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
    // Only the picture dims: dimmed text would fail contrast and read as disabled.
    expect(row).not.toHaveProp(
      "className",
      expect.stringContaining("opacity-50"),
    );
  });

  it("dims only the artwork of a row without a destination", async () => {
    await renderScreen(
      <ListRow
        title="Pending"
        leading={{ artwork: "https://c.saavncdn.com/a-150x150.jpg" }}
      />,
    );

    const row = screen.getByLabelText("Pending");
    expect(row).not.toHaveProp(
      "className",
      expect.stringContaining("opacity-50"),
    );
    expect(screen.getByTestId("list-row-art")).toHaveProp(
      "className",
      "opacity-50",
    );
    expect(screen.getByText("Pending")).not.toHaveProp(
      "className",
      expect.stringContaining("opacity"),
    );
  });

  it("shows the pause mark for a paused current track", async () => {
    await renderScreen(
      <ListRow
        title="Song"
        leading={{ index: 3 }}
        onPress={jest.fn()}
        selected
        paused
      />,
    );

    expect(screen.getByTestId("now-paused")).toBeOnTheScreen();
    expect(screen.queryByTestId("now-playing")).toBeNull();
  });

  it("puts the current track in a tonal container on Android", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    await renderScreen(
      <ListRow
        title="Song"
        leading={{ artwork: "https://c.saavncdn.com/a-150x150.jpg" }}
        onPress={jest.fn()}
        selected
      />,
    );

    expect(screen.getByTestId("now-playing")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Song" })).toBeSelected();
    expect(screen.getByTestId("list-row-container")).toHaveProp(
      "className",
      "bg-secondary",
    );
  });

  it("keeps trailing controls where they are when a row becomes current", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    const trailing = (
      <IconButton
        icon={{ ios: "heart", android: "favorite_border" }}
        label="Like"
        onPress={() => {}}
      />
    );
    await renderScreen(
      <>
        <ListRow title="Plain" onPress={jest.fn()} trailing={trailing} />
        <ListRow
          title="Current"
          onPress={jest.fn()}
          trailing={trailing}
          selected
        />
      </>,
    );
    const [plain, current] = screen
      .getAllByTestId("list-row-container")
      .map((fill) => StyleSheet.flatten(fill.parent?.props.style));

    // Distance of the controls from the edge: margin plus padding.
    const gap = (style: typeof plain) =>
      (style.marginEnd ?? 0) + (style.paddingEnd ?? 0);
    expect(gap(current)).toBe(gap(plain));
    expect(current.marginStart).toBe(space.sm);
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

  it("puts the explicit mark on the title line, before the title", async () => {
    await renderScreen(
      <ListRow title="Song" subtitle="Artist" explicit onPress={jest.fn()} />,
    );

    expect(
      screen.getByRole("button", { name: "Song, Explicit, Artist" }),
    ).toBeOnTheScreen();
    expect(titleLineTexts(screen.getByText("Song"))).toEqual(["E", "Song"]);
  });

  it("keeps the 64pt minimum and grows with Dynamic Type", async () => {
    await renderScreen(<ListRow title="Song" onPress={jest.fn()} />);

    const className: string = screen.getByRole("button", { name: "Song" }).props
      .className;
    expect(className).toContain("min-h-row");
    expect(className).not.toMatch(/(^| )h-/);
  });
});
