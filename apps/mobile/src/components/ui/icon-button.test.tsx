import { fireEvent, screen } from "@testing-library/react-native";
import { Platform, StyleSheet } from "react-native";

import { tap } from "~/lib/haptics";
import { renderScreen } from "~/test/render";
import { sizes } from "~/theme/tokens";

import { IconButton } from "./icon-button";

jest.mock("~/lib/haptics");

const PLAY = { ios: "play.fill", android: "play_arrow" } as const;

const TONAL = "size-ctl items-center justify-center rounded-full bg-secondary";

/** Whether the rendered tree holds the selected state's tonal container. */
function hasTonalContainer(): boolean {
  return JSON.stringify(screen.toJSON()).includes(TONAL);
}

describe("IconButton", () => {
  it("taps once per press", async () => {
    const onPress = jest.fn();
    await renderScreen(
      <IconButton icon={PLAY} label="Play" onPress={onPress} />,
    );
    await fireEvent.press(screen.getByRole("button", { name: "Play" }));
    expect(tap).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("has no container while not selected", async () => {
    await renderScreen(
      <IconButton icon={PLAY} label="Lyrics" onPress={jest.fn()} />,
    );

    expect(hasTonalContainer()).toBe(false);
  });

  it("shows a selected toggle in the tonal container, same target", async () => {
    await renderScreen(
      <IconButton icon={PLAY} label="Lyrics" onPress={jest.fn()} selected />,
    );

    const lyrics = screen.getByRole("button", { name: "Lyrics" });
    expect(lyrics).toBeSelected();
    expect(lyrics).toHaveProp(
      "className",
      expect.stringContaining("min-h-touch min-w-touch"),
    );
    expect(hasTonalContainer()).toBe(true);
  });

  describe("on Android", () => {
    beforeEach(() => jest.replaceProperty(Platform, "OS", "android"));

    it("draws a contained button at 40dp with slop to the 48dp target", async () => {
      await renderScreen(
        <IconButton
          icon={PLAY}
          label="Shuffle"
          variant="tonal"
          onPress={jest.fn()}
        />,
      );

      const button = screen.getByRole("button", { name: "Shuffle" });
      expect(StyleSheet.flatten(button.props.style)).toMatchObject({
        width: sizes.ctl,
        height: sizes.ctl,
      });
      const slop = button.props.hitSlop;
      expect(sizes.ctl + slop.top + slop.bottom).toBe(sizes.touch);
      expect(sizes.ctl + slop.left + slop.right).toBe(sizes.touch);
    });

    it("draws a large one at 56dp with no slop", async () => {
      await renderScreen(
        <IconButton
          icon={PLAY}
          label="Play"
          variant="filled"
          large
          onPress={jest.fn()}
        />,
      );

      const button = screen.getByRole("button", { name: "Play" });
      expect(StyleSheet.flatten(button.props.style)).toMatchObject({
        width: sizes.row,
        height: sizes.row,
      });
      expect(button.props.hitSlop).toBeUndefined();
    });

    it("presses through the corner morph", async () => {
      const onPress = jest.fn();
      await renderScreen(
        <IconButton
          icon={PLAY}
          label="Play"
          variant="filled"
          onPress={onPress}
        />,
      );

      const button = screen.getByRole("button", { name: "Play" });
      await fireEvent(button, "pressIn");
      await fireEvent(button, "pressOut");
      await fireEvent.press(button);

      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });
});
