import { act, screen } from "@testing-library/react-native";
import { getAnimatedStyle } from "react-native-reanimated";

import { renderWithProviders } from "~/test/render";

import { Equalizer } from "./equalizer";

let mockReducedMotion = false;
jest.mock("react-native-reanimated", () => {
  const actual = jest.requireActual("react-native-reanimated");
  // A proxy, not a spread: `default` and friends are getters on the module.
  return new Proxy(actual, {
    get: (target, key) =>
      key === "useReducedMotion" ? () => mockReducedMotion : target[key],
  });
});

/** Each bar's current `scaleY`, as Reanimated applied it to the view. */
function scales(): number[] {
  type Node = typeof screen.root;
  const bars: Node[] = [];
  const walk = (node: Node | string | null | undefined) => {
    if (node === null || node === undefined || typeof node === "string") return;
    if ("jestAnimatedStyle" in node.props) bars.push(node);
    node.children.forEach((child) => walk(child as Node | string));
  };
  walk(screen.root);
  return bars.map((bar) => {
    const { transform } = getAnimatedStyle(bar) as {
      transform?: { scaleY?: number }[];
    };
    return (
      transform?.find((entry) => entry.scaleY !== undefined)?.scaleY ?? NaN
    );
  });
}

const settle = () => act(async () => jest.advanceTimersByTime(1000));

beforeEach(() => {
  jest.useFakeTimers();
  mockReducedMotion = false;
});
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe("Equalizer", () => {
  it("draws three bars", async () => {
    await renderWithProviders(<Equalizer playing={false} color="black" />);
    expect(scales()).toHaveLength(3);
  });

  it("rests the bars low and still while paused", async () => {
    await renderWithProviders(<Equalizer playing={false} color="black" />);
    await settle();
    expect(scales()).toEqual([0.25, 0.25, 0.25]);

    // Still: nothing moves as time passes.
    await settle();
    expect(scales()).toEqual([0.25, 0.25, 0.25]);
  });

  it("holds the bars still at staggered heights under reduced motion", async () => {
    mockReducedMotion = true;
    await renderWithProviders(<Equalizer playing color="black" />);
    await settle();
    expect(scales()).toEqual([0.45, 0.8, 0.6]);

    await settle();
    expect(scales()).toEqual([0.45, 0.8, 0.6]);
  });

  it("bounces the bars while playing, and settles low again on pause", async () => {
    const { rerender } = await renderWithProviders(
      <Equalizer playing color="black" />,
    );
    await act(async () => jest.advanceTimersByTime(200));
    const first = scales();
    await act(async () => jest.advanceTimersByTime(100));
    expect(scales()).not.toEqual(first);

    await rerender(<Equalizer playing={false} color="black" />);
    await settle();
    expect(scales()).toEqual([0.25, 0.25, 0.25]);
  });
});
