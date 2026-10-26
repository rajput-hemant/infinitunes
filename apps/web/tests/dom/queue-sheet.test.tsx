import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
  spyOn,
} from "bun:test";

import type { Queue as QueueItem } from "@infinitunes/types";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { AudioPlayerProvider } from "react-use-audio-player";
import * as sonner from "sonner";

import { useQueuePane } from "../../components/player/use-queue-pane";
import { Queue } from "../../components/queue";
import { THEME_BOOTSTRAP_SCRIPT } from "../../lib/theme-script";

function song(id: string): QueueItem {
  return {
    id,
    name: `Song ${id}`,
    subtitle: "",
    url: `https://www.jiosaavn.com/song/song-${id}/${id}`,
    type: "song",
    image: "https://c.saavncdn.com/x-150x150.jpg",
    artists: [],
    download_url: "",
    queueItemId: `q-${id}`,
    duration: 100,
  };
}

const noop = () => {};

// Row removal commits from a 200ms exit timer. Fake timers make that boundary
// exact: a wall-clock sleep races the timer when the machine is loaded.
const advance = (ms: number) =>
  act(async () => {
    jest.advanceTimersByTime(ms);
  });

// The pane lists upcoming tracks only, so every queue starts with the playing "p".
const storedIds = () =>
  JSON.parse(localStorage.getItem("queue") ?? "[]")
    .map((item: QueueItem) => item.id)
    .filter((id: string) => id !== "p");

async function mount() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <SearchParamsContext.Provider value={new URLSearchParams()}>
        <AudioPlayerProvider>
          <Queue open onOpenChange={noop} />
        </AudioPlayerProvider>
      </SearchParamsContext.Provider>,
    );
  });
  return root;
}

describe("queue pane", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("scrolls only the Up next list; the header and now playing stay put", async () => {
    localStorage.setItem(
      "queue",
      JSON.stringify([song("p"), song("a"), song("b")]),
    );
    localStorage.setItem("current_song_index", "0");

    const root = await mount();
    const aside = document.querySelector("aside#player-queue");
    const scroller = aside?.querySelector("[data-queue-scroll]");
    expect(scroller).not.toBeNull();

    // The list lives in the scroll container; nothing above it does.
    expect(scroller?.querySelector('ol[aria-label="Queue"]')).not.toBeNull();
    const text = scroller?.textContent ?? "";
    expect(text).not.toContain("Now playing");
    expect(text).not.toContain("Up next");
    expect(text).not.toContain("Song p");

    // No ancestor of the fixed section scrolls, and the pane itself clips.
    const fixed = aside?.querySelector("[data-queue-fixed]");
    expect(fixed?.textContent).toContain("Now playing");
    expect(fixed?.textContent).toContain("Up next");
    expect(scroller?.contains(fixed ?? null)).toBe(false);
    const scrollers = [...(aside?.querySelectorAll("*") ?? [])].filter((el) =>
      /(^|\s)overflow-y-auto(\s|$)/.test(el.getAttribute("class") ?? ""),
    );
    expect(scrollers).toEqual([scroller as Element]);

    await act(async () => root.unmount());
  });

  it("removes the last track and hands focus to the list", async () => {
    localStorage.setItem("queue", JSON.stringify([song("p"), song("a")]));
    localStorage.setItem("current_song_index", "0");

    const root = await mount();

    expect(document.body.textContent).toContain("2 Tracks");

    const remove = document.querySelector<HTMLButtonElement>(
      "[data-queue-remove]",
    );
    expect(remove?.getAttribute("aria-label")).toBe("Remove Song a from queue");

    await act(async () => {
      remove?.click();
    });
    // Removal commits once the 200ms exit transition has finished.
    await advance(250);

    expect(storedIds()).toEqual([]);
    expect(document.body.textContent).toContain("1 Track");
    expect(document.body.textContent).not.toContain("1 Tracks");
    expect(document.querySelector("[data-queue-remove]")).toBeNull();
    expect(document.activeElement).toBe(
      document.querySelector('ol[aria-label="Queue"]'),
    );

    await act(async () => root.unmount());
  });

  it("returns focus to the queue toggle when the pane closes around it", async () => {
    localStorage.setItem("queue", JSON.stringify([song("p"), song("a")]));
    localStorage.setItem("current_song_index", "0");

    function Harness() {
      const [open, setOpen] = React.useState(true);
      return (
        <SearchParamsContext.Provider value={new URLSearchParams()}>
          <AudioPlayerProvider>
            <button type="button" aria-controls="player-queue">
              Toggle
            </button>
            <Queue open={open} onOpenChange={setOpen} />
          </AudioPlayerProvider>
        </SearchParamsContext.Provider>
      );
    }
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => root.render(<Harness />));

    const close = document.querySelector<HTMLButtonElement>(
      '[aria-label="Close queue"]',
    );
    close?.focus();
    expect(document.activeElement).toBe(close ?? null);
    await act(async () => close?.click());

    expect(document.activeElement).toBe(
      document.querySelector('button[aria-controls="player-queue"]'),
    );
    await act(async () => root.unmount());
    container.remove();
  });

  it("gives queue artist links a 24px mobile touch target", async () => {
    const artist = {
      id: "a1",
      name: "Singer",
      perma_url: "https://www.jiosaavn.com/artist/singer/a1",
      type: "artist" as const,
      image: "",
      role: "",
    };
    localStorage.setItem(
      "queue",
      JSON.stringify([song("p"), { ...song("a"), artists: [artist] }]),
    );
    localStorage.setItem("current_song_index", "0");

    const root = await mount();

    const link = document.querySelector<HTMLAnchorElement>(
      'ol[aria-label="Queue"] a[href*="/artist/"]',
    );
    expect(link?.textContent).toBe("Singer");
    // 24px minimum on touch, desktop keeps the plain inline link.
    expect(link?.className).toContain("min-h-6");
    expect(link?.className).toContain("lg:min-h-0");

    await act(async () => root.unmount());
  });

  it("hands focus to the row that took the removed row's place", async () => {
    localStorage.setItem(
      "queue",
      JSON.stringify([song("p"), song("a"), song("b"), song("c")]),
    );
    localStorage.setItem("current_song_index", "0");

    const root = await mount();
    expect(document.body.textContent).toContain("4 Tracks");

    await act(async () => {
      document
        .querySelector<HTMLButtonElement>(
          '[aria-label="Remove Song b from queue"]',
        )
        ?.click();
    });
    await advance(250);

    expect(storedIds()).toEqual(["a", "c"]);
    expect(document.body.textContent).toContain("3 Tracks");
    expect(document.activeElement?.getAttribute("aria-label")).toBe(
      "Remove Song c from queue",
    );

    await act(async () => root.unmount());
  });

  describe("exit transition", () => {
    const sleep = advance;
    const removeButton = (id: string) =>
      document.querySelector<HTMLButtonElement>(
        `[aria-label="Remove Song ${id} from queue"]`,
      );
    async function open(ids: string[]) {
      localStorage.setItem("queue", JSON.stringify(["p", ...ids].map(song)));
      localStorage.setItem("current_song_index", "0");
      return mount();
    }

    const realMatchMedia = window.matchMedia;
    afterEach(() => {
      window.matchMedia = realMatchMedia;
      document.body.innerHTML = "";
    });

    it("removes two different rapidly removed rows and focuses a staying row", async () => {
      const root = await open(["a", "b", "c", "d"]);

      await act(async () => {
        removeButton("b")?.click();
      });
      await sleep(100);
      await act(async () => {
        removeButton("c")?.click();
      });

      // Leaving rows are inert: no dead tab stop, no second activation.
      for (const id of ["b", "c"]) {
        const button = removeButton(id);
        expect(button?.disabled).toBe(true);
        expect(button?.tabIndex).toBe(-1);
        const row = button?.closest("li");
        expect(row?.hasAttribute("data-leaving")).toBe(true);
        expect(row?.hasAttribute("inert")).toBe(true);
        expect(row?.getAttribute("aria-hidden")).toBe("true");
        // The row gap lives in padding, which a 0fr grid row does not collapse:
        // it must animate away too or the list snaps up 8px when the row drops.
        expect(row?.firstElementChild?.className).toContain(
          "group-data-leaving/row:pb-0",
        );
      }

      // b has committed, c is still leaving: focus must skip the leaving row.
      await sleep(150);
      expect(storedIds()).toEqual(["a", "c", "d"]);
      expect(document.activeElement).toBe(removeButton("d"));

      await sleep(150);
      expect(storedIds()).toEqual(["a", "d"]);
      expect(document.activeElement).toBe(removeButton("d"));

      await act(async () => root.unmount());
    });

    it("ignores a second activation of a row that is already leaving", async () => {
      const toasts = spyOn(sonner, "toast");
      const root = await open(["a", "b"]);
      const button = removeButton("a");
      // Invoke the React handler directly: `disabled` already blocks real clicks.
      const propsKey = Object.keys(button ?? {}).find((key) =>
        key.startsWith("__reactProps"),
      );
      const onClick = (
        button as unknown as Record<string, { onClick: () => void }>
      )[propsKey ?? ""]?.onClick;
      expect(onClick).toBeFunction();

      const before = toasts.mock.calls.length;
      await act(async () => {
        onClick?.();
        onClick?.();
      });
      expect(toasts.mock.calls.length - before).toBe(1);

      await sleep(250);
      expect(storedIds()).toEqual(["b"]);

      toasts.mockRestore();
      await act(async () => root.unmount());
    });

    it("offers Undo that puts the removed row back where it was", async () => {
      const toasts = spyOn(sonner, "toast");
      const root = await open(["a", "b", "c"]);
      await act(async () => {
        removeButton("b")?.click();
      });
      await sleep(250);
      expect(storedIds()).toEqual(["a", "c"]);

      const options = toasts.mock.calls.at(-1)?.[1] as unknown as {
        action?: { label: string; onClick: () => void };
      };
      expect(options.action?.label).toBe("Undo");
      await act(async () => options.action?.onClick());

      expect(storedIds()).toEqual(["a", "b", "c"]);

      toasts.mockRestore();
      await act(async () => root.unmount());
    });

    it("undoes a removal that is still leaving by cancelling it", async () => {
      const toasts = spyOn(sonner, "toast");
      const root = await open(["a", "b"]);
      await act(async () => {
        removeButton("a")?.click();
      });
      const options = toasts.mock.calls.at(-1)?.[1] as unknown as {
        action?: { onClick: () => void };
      };
      await act(async () => options.action?.onClick());
      await sleep(250);

      expect(storedIds()).toEqual(["a", "b"]);
      expect(removeButton("a")?.disabled).toBe(false);

      toasts.mockRestore();
      await act(async () => root.unmount());
    });

    it("removes immediately under reduced motion", async () => {
      window.matchMedia = ((query: string) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        onchange: null,
        dispatchEvent: () => false,
      })) as unknown as typeof window.matchMedia;

      const root = await open(["a", "b"]);
      await act(async () => {
        removeButton("a")?.click();
      });

      // No 200ms ghost row with a live remove button.
      expect(removeButton("a")).toBeNull();
      expect(storedIds()).toEqual(["b"]);

      await act(async () => root.unmount());
    });

    it("still removes the row when the pane unmounts mid-transition", async () => {
      const errors = spyOn(console, "error");
      const root = await open(["a", "b"]);

      await act(async () => {
        removeButton("a")?.click();
      });
      expect(storedIds()).toEqual(["a", "b"]);

      await act(async () => root.unmount());
      expect(storedIds()).toEqual(["b"]);

      // The cancelled timer must not run a second, stale commit.
      await sleep(250);
      expect(storedIds()).toEqual(["b"]);
      expect(errors).not.toHaveBeenCalled();
      errors.mockRestore();
    });
  });
});

function setViewport(wide: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: wide && query === "(min-width: 1440px)",
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

function Pane() {
  const pane = useQueuePane();
  return (
    <>
      <button
        type="button"
        aria-label="Toggle queue"
        aria-expanded={pane.open}
        onClick={() => pane.setOpen(!pane.open)}
      />
      <Queue open={pane.open} onOpenChange={pane.setOpen} />
    </>
  );
}

async function mountPane() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <SearchParamsContext.Provider value={new URLSearchParams()}>
        <AudioPlayerProvider>
          <Pane />
        </AudioPlayerProvider>
      </SearchParamsContext.Provider>,
    );
  });
  return root;
}

const toggle = () =>
  document.querySelector<HTMLButtonElement>('[aria-label="Toggle queue"]');
const pane = () => document.querySelector("aside#player-queue");

describe("queue pane open state", () => {
  const realMatchMedia = window.matchMedia;
  afterEach(() => {
    window.matchMedia = realMatchMedia;
    document.body.innerHTML = "";
    document.documentElement.removeAttribute("data-queue");
    document.documentElement.removeAttribute("class");
    document.documentElement.removeAttribute("style");
  });

  it("docks at 1440px, persists the choice and tells the shell", async () => {
    setViewport(true);
    localStorage.setItem("queue_open", "true");
    localStorage.setItem("queue", JSON.stringify([song("a"), song("b")]));
    localStorage.setItem("current_song_index", "0");
    const root = await mountPane();

    expect(toggle()?.getAttribute("aria-expanded")).toBe("true");
    expect(pane()?.hasAttribute("inert")).toBe(false);
    expect(document.documentElement.getAttribute("data-queue")).toBe("open");

    await act(async () => toggle()?.click());

    expect(toggle()?.getAttribute("aria-expanded")).toBe("false");
    expect(pane()?.hasAttribute("inert")).toBe(true);
    expect(localStorage.getItem("queue_open")).toBe("false");
    expect(document.documentElement.hasAttribute("data-queue")).toBe(false);

    await act(async () => toggle()?.click());
    expect(localStorage.getItem("queue_open")).toBe("true");

    await act(async () => root.unmount());
  });

  // The shell reserves the column from the attribute before the client-only
  // player mounts, so mounting must keep it rather than flip it.
  it("keeps the attribute the bootstrap script set before first paint", async () => {
    setViewport(true);
    localStorage.setItem("queue", JSON.stringify([song("a")]));
    localStorage.setItem("queue_open", "true");
    new Function(THEME_BOOTSTRAP_SCRIPT)();
    expect(document.documentElement.getAttribute("data-queue")).toBe("open");

    const root = await mountPane();
    expect(toggle()?.getAttribute("aria-expanded")).toBe("true");
    expect(document.documentElement.getAttribute("data-queue")).toBe("open");

    await act(async () => root.unmount());
  });

  it("agrees with the bootstrap script when the user closed the docked pane", async () => {
    setViewport(true);
    localStorage.setItem("queue_open", "false");
    new Function(THEME_BOOTSTRAP_SCRIPT)();
    expect(document.documentElement.hasAttribute("data-queue")).toBe(false);

    const root = await mountPane();
    expect(toggle()?.getAttribute("aria-expanded")).toBe("false");
    expect(document.documentElement.hasAttribute("data-queue")).toBe(false);

    await act(async () => root.unmount());
  });

  it("starts closed on a first visit at 1440px, without the shell column", async () => {
    setViewport(true);
    localStorage.removeItem("queue_open");
    new Function(THEME_BOOTSTRAP_SCRIPT)();
    expect(document.documentElement.hasAttribute("data-queue")).toBe(false);

    const root = await mountPane();
    expect(toggle()?.getAttribute("aria-expanded")).toBe("false");
    expect(pane()?.hasAttribute("inert")).toBe(true);
    expect(document.documentElement.hasAttribute("data-queue")).toBe(false);

    await act(async () => root.unmount());
  });

  it("drops the bootstrap attribute on a narrow viewport", async () => {
    setViewport(false);
    localStorage.setItem("queue_open", "true");
    new Function(THEME_BOOTSTRAP_SCRIPT)();
    expect(document.documentElement.getAttribute("data-queue")).toBe("open");

    const root = await mountPane();
    expect(document.documentElement.hasAttribute("data-queue")).toBe(false);

    await act(async () => root.unmount());
  });

  it("floats below 1440px, starts closed and does not persist", async () => {
    setViewport(false);
    localStorage.removeItem("queue_open");
    const root = await mountPane();

    expect(toggle()?.getAttribute("aria-expanded")).toBe("false");
    expect(pane()?.hasAttribute("inert")).toBe(true);

    await act(async () => toggle()?.click());
    expect(toggle()?.getAttribute("aria-expanded")).toBe("true");
    expect(localStorage.getItem("queue_open")).toBeNull();
    expect(document.documentElement.hasAttribute("data-queue")).toBe(false);

    await act(async () => root.unmount());
  });

  it("closes on Escape and from the close button", async () => {
    setViewport(false);
    const root = await mountPane();

    await act(async () => toggle()?.click());
    await act(async () => {
      pane()?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });
    expect(toggle()?.getAttribute("aria-expanded")).toBe("false");

    await act(async () => toggle()?.click());
    await act(async () => {
      document
        .querySelector<HTMLButtonElement>('[aria-label="Close queue"]')
        ?.click();
    });
    expect(toggle()?.getAttribute("aria-expanded")).toBe("false");

    await act(async () => root.unmount());
  });

  it("clears only the upcoming tracks", async () => {
    setViewport(false);
    localStorage.setItem(
      "queue",
      JSON.stringify([song("a"), song("b"), song("c")]),
    );
    localStorage.setItem("current_song_index", "1");
    const root = await mountPane();
    await act(async () => toggle()?.click());

    const clear = [
      ...document.querySelectorAll<HTMLButtonElement>("aside button"),
    ].find((button) => button.textContent === "Clear");
    // The bare word is ambiguous out of context for screen readers.
    expect(clear?.getAttribute("aria-label")).toBe("Clear up next");
    await act(async () => clear?.click());

    expect(storedIds()).toEqual(["a", "b"]);
    expect(localStorage.getItem("current_song_index")).toBe("1");
    // No autoplay exists, so the empty state promises none.
    expect(document.body.textContent).toContain("Nothing else is queued.");
    expect(document.body.textContent).not.toContain("Autoplay");

    await act(async () => root.unmount());
  });
});
