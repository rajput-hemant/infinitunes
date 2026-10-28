import { afterEach, expect, it, mock, jest } from "bun:test";

import { createPositionStore } from "@infinitunes/core/react/position-store";
import { act, Profiler } from "react";
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

it("renders other songs as text and publishes active lines without rerendering between timestamps", async () => {
  const position = createPositionStore(-1);
  const commits = mock(() => {});
  const host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () =>
    root?.render(
      <Profiler id="lyrics" onRender={commits}>
        <SyncedLyrics
          position={position}
          lines={[
            { time: 1, text: "First" },
            { time: 5, text: "" },
          ]}
          prominent
        />
      </Profiler>,
    ),
  );
  expect(host.querySelectorAll("button")).toHaveLength(0);
  expect(host.querySelector("section p")?.className).toContain("opacity-55");
  await act(async () => position.set(2));
  expect(host.querySelector("output")?.textContent).toBe("First");
  const count = commits.mock.calls.length;
  await act(async () => position.set(3));
  expect(commits.mock.calls.length).toBe(count);
  await act(async () => position.set(5));
  expect(host.querySelector("output")?.textContent).toBe("Instrumental break");
});

it("resumes after four seconds of idle browsing and respects in-app reduced motion", async () => {
  jest.useFakeTimers();
  const position = createPositionStore(1);
  const scroll = mock(() => {});
  const originalScrollTo = HTMLElement.prototype.scrollTo;
  HTMLElement.prototype.scrollTo = scroll;
  document.documentElement.dataset.motion = "reduced";
  const host = document.createElement("div");
  document.body.append(host);
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
          onSeek={() => {}}
          prominent
        />,
      ),
    );
    expect(scroll).toHaveBeenLastCalledWith({ top: 0, behavior: "instant" });
    const section = host.querySelector("section")!;
    section.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "PageDown", bubbles: true }),
    );
    const count = scroll.mock.calls.length;
    await act(async () => position.set(5));
    await act(async () => jest.advanceTimersByTime(3999));
    expect(scroll.mock.calls.length).toBe(count);
    section.dispatchEvent(new window.Event("scroll"));
    await act(async () => jest.advanceTimersByTime(3999));
    expect(scroll.mock.calls.length).toBe(count);
    await act(async () => jest.advanceTimersByTime(1));
    expect(scroll.mock.calls.length).toBe(count + 1);
    expect(host.querySelector('[aria-current="true"]')?.textContent).toBe(
      "Second",
    );
    section.dispatchEvent(new window.Event("pointerdown", { bubbles: true }));
    await act(async () => position.set(1));
    const heldCount = scroll.mock.calls.length;
    await act(async () => jest.advanceTimersByTime(5000));
    expect(scroll.mock.calls.length).toBe(heldCount);
    window.dispatchEvent(new window.Event("pointerup"));
    await act(async () => jest.advanceTimersByTime(4000));
    expect(scroll.mock.calls.length).toBe(heldCount + 1);
  } finally {
    await act(async () => root?.unmount());
    root = undefined;
    jest.useRealTimers();
    HTMLElement.prototype.scrollTo = originalScrollTo;
    delete document.documentElement.dataset.motion;
  }
});
