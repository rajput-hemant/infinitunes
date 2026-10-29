import { act, screen } from "@testing-library/react-native";
import { Platform, Text } from "react-native";

import { renderWithProviders } from "~/test/render";

import { DeferredDetails } from "./deferred-details";

it.each(["ios", "android"] as const)(
  "lets %s paint before mounting secondary content",
  async (os) => {
    jest.replaceProperty(Platform, "OS", os);
    const frames: FrameRequestCallback[] = [];
    const raf = jest
      .spyOn(globalThis, "requestAnimationFrame")
      .mockImplementation((callback) => {
        frames.push(callback);
        return frames.length;
      });
    const secondary = jest.fn(() => <Text>Recommendations</Text>);
    const Secondary = secondary;
    await renderWithProviders(
      <DeferredDetails>
        <Secondary />
      </DeferredDetails>,
    );
    expect(secondary).not.toHaveBeenCalled();
    await act(() => frames.shift()?.(0));
    expect(secondary).not.toHaveBeenCalled();
    await act(() => frames.shift()?.(16));
    expect(screen.getByText("Recommendations")).toBeOnTheScreen();
    raf.mockRestore();
    jest.restoreAllMocks();
  },
);
