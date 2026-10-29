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

/** The persistent artwork destinations, including the visually hidden one. */
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

it("does not restart a reversed flight when a late layout arrives", async () => {
  await renderScreen(<FullPlayer />);
  await layOut(slot("none"), STAGE);
  expect(artX()).toBe(AT_STAGE);

  const toggle = screen.getByRole("button", { name: "Up next" });
  await fireEvent.press(toggle);
  // Close before the first animation frame; a late measurement must not reopen it.
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

it.each(["Up next", "Lyrics"])(
  "starts %s artwork flight on the first frame without a new layout",
  async (label) => {
    await renderScreen(<FullPlayer />);
    await layOut(slot("none"), STAGE);
    // Both destinations must already be measurable while the artwork is showing.
    await layOut(slot("box-none"), HEADER);
    const before = artX();
    await fireEvent.press(screen.getByRole("button", { name: label }));
    await act(async () => jest.advanceTimersByTime(16));
    expect(artX()).not.toBe(before);
  },
);

it("defers queue mounting and URL synchronization beyond the press", async () => {
  const app = await renderScreen(<FullPlayer />);
  await layOut(slot("none"), STAGE);
  await layOut(slot("box-none"), HEADER);
  await fireEvent.press(screen.getByRole("button", { name: "Up next" }));
  expect(screen.getByLabelText("Loading player view")).toBeOnTheScreen();
  expect(screen.queryByText("Up next · 0")).toBeNull();
  expect(app.getSearchParams()).toEqual({});
  await act(async () => jest.advanceTimersByTime(48));
  expect(screen.getByText("Up next · 0")).toBeOnTheScreen();
  expect(app.getSearchParams()).toEqual({ view: "queue" });
});

it("cancels deferred content and URL writes on a rapid reversal", async () => {
  const app = await renderScreen(<FullPlayer />);
  await layOut(slot("none"), STAGE);
  await layOut(slot("box-none"), HEADER);
  const toggle = screen.getByRole("button", { name: "Up next" });
  await fireEvent.press(toggle);
  await fireEvent.press(toggle);
  await act(async () => jest.advanceTimersByTime(600));
  expect(artX()).toBe(AT_STAGE);
  expect(screen.queryByText("Up next · 0")).toBeNull();
  expect(toggle).toHaveProp("accessibilityState", { selected: false });
  expect(app.getSearchParams()).toEqual({});
});
