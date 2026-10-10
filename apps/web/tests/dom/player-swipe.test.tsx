import { describe, expect, it } from "bun:test";

import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";

import { useSwipe } from "../../components/player/use-swipe";

function Swipeable({
  direction,
  onSwipe,
}: {
  direction: "up" | "down";
  onSwipe: () => void;
}) {
  const swipe = useSwipe({ direction, distance: 40, onSwipe });
  return (
    <div
      data-testid="surface"
      onTouchStart={swipe.onTouchStart}
      onTouchEnd={swipe.onTouchEnd}
    />
  );
}

function touch(
  surface: Element,
  type: "touchstart" | "touchend",
  clientY: number,
) {
  const event = new Event(type, { bubbles: true });
  const list = [{ clientY }];
  Object.defineProperty(
    event,
    type === "touchstart" ? "touches" : "changedTouches",
    {
      value: list,
    },
  );
  act(() => {
    surface.dispatchEvent(event);
  });
}

async function mount(direction: "up" | "down") {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let swipes = 0;
  await act(async () => {
    root.render(<Swipeable direction={direction} onSwipe={() => swipes++} />);
  });
  const surface = host.querySelector("[data-testid=surface]");
  if (!surface) throw new Error("surface not rendered");
  return {
    surface,
    swipes: () => swipes,
    unmount: () => {
      act(() => root.unmount());
      host.remove();
    },
  };
}

describe("useSwipe", () => {
  it("fires for an upward drag past the distance", async () => {
    const view = await mount("up");
    touch(view.surface, "touchstart", 300);
    touch(view.surface, "touchend", 250);
    expect(view.swipes()).toBe(1);
    view.unmount();
  });

  it("ignores an upward drag shorter than the distance", async () => {
    const view = await mount("up");
    touch(view.surface, "touchstart", 300);
    touch(view.surface, "touchend", 270);
    expect(view.swipes()).toBe(0);
    view.unmount();
  });

  it("ignores a drag in the opposite direction", async () => {
    const view = await mount("up");
    touch(view.surface, "touchstart", 250);
    touch(view.surface, "touchend", 400);
    expect(view.swipes()).toBe(0);
    view.unmount();
  });

  it("fires for a downward drag and needs a fresh touchstart each time", async () => {
    const view = await mount("down");
    touch(view.surface, "touchend", 500);
    expect(view.swipes()).toBe(0);
    touch(view.surface, "touchstart", 100);
    touch(view.surface, "touchend", 200);
    touch(view.surface, "touchend", 400);
    expect(view.swipes()).toBe(1);
    view.unmount();
  });
});
