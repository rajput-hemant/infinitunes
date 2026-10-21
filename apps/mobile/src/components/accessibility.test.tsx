import type { CardItem } from "@infinitunes/types";
import { toCardItem } from "@infinitunes/types";
import { rawAlbum } from "@infinitunes/types/fixtures";
import { screen } from "@testing-library/react-native";

import { renderScreen } from "~/test/render";

import { ChipRow } from "./chip-row";
import { MediaCard } from "./media-card";
import { MenuTrigger } from "./menu-trigger";
import { Button } from "./ui/button";
import { IconButton } from "./ui/icon-button";

// Jest does not resolve Tailwind classes to styles, so a size is asserted as
// the class that sets it: `touch` is the 48dp Android target over iOS's 44pt.

describe("touch targets", () => {
  it("gives an icon button a 48pt target and its label", async () => {
    await renderScreen(
      <IconButton
        icon={{ ios: "play.fill", android: "play_arrow" }}
        label="Play"
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Play" })).toHaveProp(
      "className",
      expect.stringContaining("min-h-touch min-w-touch"),
    );
  });

  it("gives a button a 48pt minimum that grows with its text", async () => {
    await renderScreen(<Button label="Play" onPress={jest.fn()} />);

    const className: string = screen.getByRole("button", { name: "Play" }).props
      .className;
    expect(className).toContain("min-h-touch");
    expect(className).not.toMatch(/(^| )h-/);
  });

  it("names a menu trigger and says it opens a menu", async () => {
    await renderScreen(<MenuTrigger label="More actions for Song" />);

    const trigger = screen.getByRole("button", {
      name: "More actions for Song",
    });
    expect(trigger).toHaveProp(
      "className",
      expect.stringContaining("size-touch"),
    );
    expect(screen.getByHintText("Opens a menu")).toBe(trigger);
  });

  it("extends a chip's target above and below its 40pt body", async () => {
    await renderScreen(
      <ChipRow
        chips={[
          { key: "a", label: "Hindi", selected: true },
          { key: "b", label: "Tamil", selected: false, onPress: jest.fn() },
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: "Tamil" })).toHaveProp(
      "hitSlop",
      { top: 4, bottom: 4 },
    );
    expect(screen.getByRole("button", { name: "Hindi" })).toBeSelected();
    expect(screen.getByRole("button", { name: "Tamil" })).not.toBeSelected();
  });
});

describe("MediaCard", () => {
  it("is a link, not a disabled button, when it has a screen", async () => {
    await renderScreen(<MediaCard item={toCardItem(rawAlbum())} />, {
      routes: { "album/[name]/[token]": () => null },
    });

    const link = screen.getByRole("link", { name: /^Udta Teer/ });
    expect(link).toBeEnabled();
  });

  it("is a plain labelled view when its type has no screen", async () => {
    const channel: CardItem = { ...toCardItem(rawAlbum()), type: "channel" };
    await renderScreen(<MediaCard item={channel} />);

    expect(screen.queryByRole("link")).toBeNull();
    const card = screen.getByLabelText(/^Udta Teer/);
    expect(card).toBeOnTheScreen();
    expect(card).not.toBeDisabled();
    expect(card).toHaveProp("accessible", true);
  });
});
