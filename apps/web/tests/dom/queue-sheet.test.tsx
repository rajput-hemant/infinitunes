import { afterEach, describe, expect, it, spyOn } from "bun:test";

import type { Queue as QueueItem } from "@infinitunes/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { AudioPlayerProvider } from "react-use-audio-player";
import * as sonner from "sonner";
import superjson from "superjson";

import { Queue } from "../../components/queue";
import { api } from "../../lib/trpc/client";

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
    duration: 100,
  };
}

const queryClient = new QueryClient();
const trpcClient = api.createClient({
  links: [httpBatchLink({ url: "/api/trpc", transformer: superjson })],
});

async function mount() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <SearchParamsContext.Provider value={new URLSearchParams()}>
        <api.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <AudioPlayerProvider>
              <Queue />
            </AudioPlayerProvider>
          </QueryClientProvider>
        </api.Provider>
      </SearchParamsContext.Provider>,
    );
  });
  return root;
}

describe("queue sheet", () => {
  it("removes the last track and hands focus to the list", async () => {
    localStorage.setItem("queue", JSON.stringify([song("a")]));
    localStorage.setItem("current_song_index", "0");

    const root = await mount();

    const trigger = document.querySelector<HTMLButtonElement>(
      '[aria-label="Open queue"]',
    );
    expect(trigger).not.toBeNull();
    await act(async () => {
      trigger?.click();
    });

    // Overrides the stock sheet `sm:max-w-sm` for master parity.
    expect(
      document.querySelector('[data-slot="sheet-content"]')?.className,
    ).toContain("sm:max-w-xl!");

    expect(document.body.textContent).toContain("1 Track");
    expect(document.body.textContent).not.toContain("1 Tracks");

    const remove = document.querySelector<HTMLButtonElement>(
      "[data-queue-remove]",
    );
    expect(remove?.getAttribute("aria-label")).toBe("Remove Song a from queue");

    await act(async () => {
      remove?.click();
    });
    await act(async () => {
      // Removal commits once the 200ms exit transition has finished.
      await new Promise((resolve) => setTimeout(resolve, 250));
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    expect(JSON.parse(localStorage.getItem("queue") ?? "null")).toEqual([]);
    expect(document.querySelector("[data-queue-remove]")).toBeNull();
    expect(document.activeElement).toBe(
      document.querySelector('ol[aria-label="Queue"]'),
    );

    await act(async () => root.unmount());
  });

  it("hands focus to the row that took the removed row's place", async () => {
    localStorage.setItem(
      "queue",
      JSON.stringify([song("a"), song("b"), song("c")]),
    );
    localStorage.setItem("current_song_index", "0");

    const root = await mount();
    await act(async () => {
      document
        .querySelector<HTMLButtonElement>('[aria-label="Open queue"]')
        ?.click();
    });
    expect(document.body.textContent).toContain("3 Tracks");

    await act(async () => {
      document
        .querySelector<HTMLButtonElement>(
          '[aria-label="Remove Song b from queue"]',
        )
        ?.click();
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250));
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    const ids = JSON.parse(localStorage.getItem("queue") ?? "[]").map(
      (item: QueueItem) => item.id,
    );
    expect(ids).toEqual(["a", "c"]);
    expect(document.body.textContent).toContain("2 Tracks");
    expect(document.activeElement?.getAttribute("aria-label")).toBe(
      "Remove Song c from queue",
    );

    await act(async () => root.unmount());
  });

  describe("exit transition", () => {
    const sleep = (ms: number) =>
      act(async () => {
        await new Promise((resolve) => setTimeout(resolve, ms));
      });
    const removeButton = (id: string) =>
      document.querySelector<HTMLButtonElement>(
        `[aria-label="Remove Song ${id} from queue"]`,
      );
    const storedIds = () =>
      JSON.parse(localStorage.getItem("queue") ?? "[]").map(
        (item: QueueItem) => item.id,
      );

    async function open(ids: string[]) {
      localStorage.setItem("queue", JSON.stringify(ids.map(song)));
      localStorage.setItem("current_song_index", "0");
      const root = await mount();
      await act(async () => {
        document
          .querySelector<HTMLButtonElement>('[aria-label="Open queue"]')
          ?.click();
      });
      return root;
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

    it("still removes the row when the sheet unmounts mid-transition", async () => {
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
