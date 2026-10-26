import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { getAnimatedStyle } from "react-native-reanimated";

import { playerStore } from "~/playback/player-store";
import { renderScreen } from "~/test/render";
import { art, playerArtSize, space } from "~/theme/tokens";

import { FullPlayer } from "./full-player";

let mockReducedMotion = false;
jest.mock("react-native-reanimated", () => {
  const actual = jest.requireActual("react-native-reanimated");
  // A proxy, not a spread: `default` and friends are getters on the module.
  return new Proxy(actual, {
    get: (target, key) =>
      key === "useReducedMotion" ? () => mockReducedMotion : target[key],
  });
});

const initial = playerStore.getState();

/** The screen is a 390pt phone. */
const HERO = playerArtSize(390);
const STAGE = { x: 0, y: 48, width: 390, height: 400 };
const HEADER = { x: 0, y: 48, width: 390, height: 72 };
const AT_STAGE = (STAGE.width - HERO) / 2;
const AT_HEADER = space.xl - (HERO - art.tile) / 2;

type Node = NonNullable<typeof screen.root>;

function nodes(predicate: (node: Node) => boolean) {
  const found: Node[] = [];
  const walk = (node: Node | string | null | undefined) => {
    if (!node || typeof node === "string") return;
    if (predicate(node)) found.push(node);
    node.children.forEach((child) => walk(child as Node | string));
  };
  walk(screen.root);
  return found;
}

/** The unmeasured slot of the view that shows: the stage, or the compact header row. */
function slot(pointerEvents: "none" | "box-none") {
  const [found] = nodes(
    (node) =>
      typeof node.props.onLayout === "function" &&
      node.props.pointerEvents === pointerEvents,
  );
  if (!found) throw new Error(`the ${pointerEvents} slot is not mounted`);
  return found;
}

/** Where the flying artwork sits: the one animated style that scales. */
function artX(): number {
  for (const node of nodes((each) => "jestAnimatedStyle" in each.props)) {
    // Its web typings take no argument; the native build reads the element.
    const { transform } = (
      getAnimatedStyle as unknown as (element: unknown) => {
        transform?: { translateX?: number; scale?: number }[];
      }
    )(node);
    if (!transform?.some((entry) => entry.scale !== undefined)) continue;
    return (
      transform.find((entry) => entry.translateX !== undefined)?.translateX ??
      Number.NaN
    );
  }
  throw new Error("the artwork is not mounted");
}

async function layOut(node: Node, box: typeof STAGE) {
  await act(async () => {
    node.props.onLayout({ nativeEvent: { layout: box } });
    // Reanimated applies a shared value on its own tick.
    jest.advanceTimersByTime(16);
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  mockReducedMotion = false;
  playerStore.setState(initial, true);
  playerStore.getState().playTracks([toSongRow(rawSong())]);
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

it("ignores a destination's layout that arrives after it unmounted", async () => {
  await renderScreen(<FullPlayer />);
  await layOut(slot("none"), STAGE);
  expect(artX()).toBe(AT_STAGE);

  const toggle = screen.getByRole("button", { name: "Up next" });
  await fireEvent.press(toggle);
  // The compact header mounts without a layout yet, then the view closes.
  // Taken by value: the instance reports whichever view later holds its place.
  const closedLayout = slot("box-none").props.onLayout;
  await fireEvent.press(toggle);
  await layOut(slot("none"), STAGE);

  // Its queued layout must start no flight: the artwork stays on the stage.
  await act(async () => {
    closedLayout({ nativeEvent: { layout: HEADER } });
    jest.advanceTimersByTime(16);
  });
  await act(async () => jest.advanceTimersByTime(600));
  expect(artX()).toBe(AT_STAGE);
});

it("crossfades instead of flying under reduced motion", async () => {
  mockReducedMotion = true;
  await renderScreen(<FullPlayer />);
  await layOut(slot("none"), STAGE);

  await fireEvent.press(screen.getByRole("button", { name: "Up next" }));
  await layOut(slot("box-none"), HEADER);
  // The compact slot at once: no flight waits on a frame.
  expect(artX()).toBe(AT_HEADER);
});
