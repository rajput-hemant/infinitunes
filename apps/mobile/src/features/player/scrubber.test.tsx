import { act, fireEvent, screen } from "@testing-library/react-native";

import { audioPlayer } from "~/playback/audio-engine";
import {
  playbackPosition,
  playbackStatusStore,
} from "~/playback/playback-status";
import { renderScreen } from "~/test/render";

import { Scrubber } from "./scrubber";
import type { SeekSliderProps } from "./seek-slider-props";

/**
 * The slider itself is a native view; this stands in with buttons that
 * drive the same contract (value, max, a scrub, the end of a drag).
 */
jest.mock("./seek-slider", () => {
  const { Pressable, Text } = require("react-native");
  return {
    SeekSlider: ({ value, max, onScrub, onScrubEnd }: SeekSliderProps) => (
      <>
        <Text testID="slider">{`${value}/${max}`}</Text>
        <Pressable
          accessibilityLabel="drag to 90"
          onPress={() => onScrub(90)}
        />
        <Pressable
          accessibilityLabel="drag to 120"
          onPress={() => onScrub(120)}
        />
        <Pressable accessibilityLabel="release" onPress={onScrubEnd} />
      </>
    ),
  };
});

const seek = jest.spyOn(audioPlayer, "seekTo");

beforeEach(() => {
  jest.clearAllMocks();
  playbackStatusStore.setState({
    duration: 200,
    bufferedTime: 0,
    playing: false,
  });
  playbackPosition.set(30);
});

const slider = () => screen.getByTestId("slider").props.children as string;

describe("Scrubber", () => {
  it.each([
    [{ bufferedTime: 100 }, { left: "15%", width: "35%" }],
    [{ bufferedTime: 300 }, { left: "15%", width: "85%" }],
    [{ duration: 0 }, { width: "0%" }],
  ])(
    "places the buffered range from the stores (%j)",
    async (status, style) => {
      playbackStatusStore.setState(status);
      await renderScreen(<Scrubber />);

      expect(
        screen.getByTestId("scrubber-buffered", {
          includeHiddenElements: true,
        }),
      ).toHaveStyle(style);
    },
  );

  it("changes the clocks once a second, not on every tick", async () => {
    await renderScreen(<Scrubber />);

    await act(async () => playbackPosition.set(30.5));
    expect(screen.getByText("0:30")).toBeOnTheScreen();
    expect(slider()).toBe("30.5/200");

    await act(async () => playbackPosition.set(31));
    expect(screen.getByText("0:31")).toBeOnTheScreen();
  });

  it("shows the playhead, the time left and the position for screen readers", async () => {
    await renderScreen(<Scrubber />);

    expect(screen.getByText("0:30")).toBeOnTheScreen();
    expect(screen.getByText("-2:50")).toBeOnTheScreen();
    expect(slider()).toBe("30/200");
    expect(
      screen.getByLabelText("Playback position").props.accessibilityValue,
    ).toEqual({ text: "00:30 of 03:20" });
  });

  it("follows the playhead as playback moves", async () => {
    await renderScreen(<Scrubber />);

    await act(async () => playbackPosition.set(45));

    expect(screen.getByText("0:45")).toBeOnTheScreen();
    expect(slider()).toBe("45/200");
  });

  it("shows the dragged position, and seeks once on release", async () => {
    await renderScreen(<Scrubber />);

    await fireEvent.press(screen.getByLabelText("drag to 90"));
    expect(screen.getByText("1:30")).toBeOnTheScreen();
    expect(screen.getByText("-1:50")).toBeOnTheScreen();
    expect(seek).not.toHaveBeenCalled();

    // The playhead keeps ticking while dragging; the drag wins.
    await act(async () => playbackPosition.set(31));
    expect(screen.getByText("1:30")).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText("release"));

    expect(seek).toHaveBeenCalledTimes(1);
    expect(seek).toHaveBeenCalledWith(90);
    expect(playbackPosition.get()).toBe(90);
    expect(screen.getByText("1:30")).toBeOnTheScreen();
  });

  it("seeks to where the drag ended, not where it started", async () => {
    await renderScreen(<Scrubber />);

    await fireEvent.press(screen.getByLabelText("drag to 90"));
    await fireEvent.press(screen.getByLabelText("drag to 120"));
    await fireEvent.press(screen.getByLabelText("release"));

    expect(seek).toHaveBeenCalledTimes(1);
    expect(seek).toHaveBeenCalledWith(120);
  });

  it("does not seek when a drag ends without moving", async () => {
    await renderScreen(<Scrubber />);

    await fireEvent.press(screen.getByLabelText("release"));

    expect(seek).not.toHaveBeenCalled();
  });

  it("keeps the slider and clock sane before the duration is known", async () => {
    playbackStatusStore.setState({ duration: 0 });
    playbackPosition.set(0);
    await renderScreen(<Scrubber />);

    expect(slider()).toBe("0/1");
    expect(screen.getByText("-0:00")).toBeOnTheScreen();
  });

  it("never lets the slider run past the end", async () => {
    playbackPosition.set(250);
    await renderScreen(<Scrubber />);

    expect(slider()).toBe("200/200");
    expect(screen.getByText("-0:00")).toBeOnTheScreen();
  });
});
