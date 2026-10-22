import { afterEach, expect, it, mock } from "bun:test";

import { createPositionStore } from "@infinitunes/core/react/position-store";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { SyncedLyrics } from "../../components/player/synced-lyrics";

let root: Root | undefined;
afterEach(async () => {
  await act(async () => root?.unmount());
  document.body.innerHTML = "";
});

it("highlights the current line, follows the playhead, pauses for browsing, and seeks on click", async () => {
  const position = createPositionStore(0);
  const seek = mock((seconds: number) => position.set(seconds));
  const scroll = mock(() => {});
  const host = document.createElement("div");
  document.body.append(host);
  const originalScrollTo = HTMLElement.prototype.scrollTo;
  HTMLElement.prototype.scrollTo = scroll;
  root = createRoot(host);
  try {
    await act(async () =>
      root?.render(
        <SyncedLyrics
          lines={[
            { time: 1, text: "First" },
            { time: 5, text: "Second" },
          ]}
          position={position}
          onSeek={seek}
        />,
      ),
    );
    const buttons = host.querySelectorAll("button");
    const section = host.querySelector("section")!;
    Object.defineProperty(section, "offsetTop", { value: 400 });
    Object.defineProperty(section, "clientHeight", { value: 300 });
    Object.defineProperty(buttons[0], "offsetTop", { value: 240 });
    expect(host.querySelector('[aria-current="true"]')).toBeNull();
    await act(async () => position.set(2));
    expect(buttons[0]?.getAttribute("aria-current")).toBe("true");
    expect(scroll).toHaveBeenLastCalledWith({ top: 140, behavior: "smooth" });
    const count = scroll.mock.calls.length;
    host
      .querySelector('[aria-label="Synced lyrics"]')
      ?.dispatchEvent(new window.Event("wheel", { bubbles: true }));
    await act(async () => position.set(6));
    expect(buttons[1]?.getAttribute("aria-current")).toBe("true");
    expect(scroll.mock.calls.length).toBe(count);
    await act(async () => buttons[0]?.click());
    expect(seek).toHaveBeenCalledWith(1);
    expect(buttons[0]?.getAttribute("aria-current")).toBe("true");
  } finally {
    HTMLElement.prototype.scrollTo = originalScrollTo;
  }
});
