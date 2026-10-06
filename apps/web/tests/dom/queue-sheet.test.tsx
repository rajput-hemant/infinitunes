import { describe, expect, it } from "bun:test";

import type { Queue as QueueItem } from "@infinitunes/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { AudioPlayerProvider } from "react-use-audio-player";
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
});
