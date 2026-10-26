import { afterAll, beforeAll, describe, expect, it } from "bun:test";

import { createPositionStore } from "@infinitunes/core/react/position-store";
import type { Queue as QueueItem } from "@infinitunes/types";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { AudioPlayerProvider } from "react-use-audio-player";

import { ExpandedPlayer } from "../../components/expanded-player";
import { offlineFetch } from "./offline-fetch";
import { waitFor } from "./wait-for";

// The lyrics pane queries over the network; answer it offline instead of opening a socket.
const realFetch = globalThis.fetch;
const lyricRequests: string[] = [];
beforeAll(() => {
  globalThis.fetch = Object.assign((...args: Parameters<typeof fetch>) => {
    if (String(args[0]).includes("syncedLyrics"))
      lyricRequests.push(String(args[0]));
    return offlineFetch(...args);
  }, realFetch);
});
afterAll(() => {
  globalThis.fetch = realFetch;
});

const track: QueueItem = {
  id: "a",
  name: "Song a",
  subtitle: "",
  url: "https://www.jiosaavn.com/song/song-a/a",
  type: "song",
  image: "https://c.saavncdn.com/x-150x150.jpg",
  artists: [],
  download_url: "",
  duration: 100,
};

const noop = () => {};

const router = {
  push: noop,
  replace: noop,
  refresh: noop,
  back: noop,
  forward: noop,
  prefetch: noop,
  hmrRefresh: noop,
};

async function mountExpanded(song = track) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <AppRouterContext.Provider value={router}>
        <SearchParamsContext.Provider value={new URLSearchParams()}>
          <AudioPlayerProvider>
            <ExpandedPlayer
              open
              onOpenChange={noop}
              track={song}
              position={createPositionStore(0)}
              duration={100}
              showRemainingTime={false}
              onToggleRemainingTime={noop}
              isPlaying={false}
              isLoading={false}
              isLooping={false}
              loopPlaylist={false}
              isShuffle={false}
              isMuted={false}
              isReady
              volume={1}
              onSeekStart={noop}
              onSeekChange={noop}
              onSeekCommit={noop}
              onVolumeChange={noop}
              onToggleMute={noop}
              onLoop={noop}
              onPrevious={noop}
              onPlayPause={noop}
              onNext={noop}
              onToggleShuffle={noop}
            />
          </AudioPlayerProvider>
        </SearchParamsContext.Provider>
      </AppRouterContext.Provider>,
    );
  });
  return root;
}

describe("expanded player sheet", () => {
  it("renders exactly one Close button", async () => {
    const root = await mountExpanded();

    const closes = document.querySelectorAll(
      '[role="dialog"] button[aria-label="Close"]',
    );
    expect(closes).toHaveLength(1);

    await act(async () => root.unmount());
  });

  it("keeps the pane behind phone toggles that name the view", async () => {
    const root = await mountExpanded();
    const toggle = (label: string) =>
      [...document.querySelectorAll<HTMLButtonElement>("button")].find(
        (button) =>
          button.hasAttribute("aria-expanded") &&
          button.textContent?.trim() === label,
      );
    const region = () =>
      document.getElementById(
        toggle("Up next")?.getAttribute("aria-controls") ?? "",
      );

    expect(toggle("Up next")?.getAttribute("aria-expanded")).toBe("false");
    expect(toggle("Lyrics")?.getAttribute("aria-expanded")).toBe("false");
    expect(region()?.classList.contains("hidden")).toBe(true);

    await act(async () => toggle("Up next")?.click());
    expect(toggle("Up next")?.getAttribute("aria-expanded")).toBe("true");
    expect(region()?.classList.contains("hidden")).toBe(false);

    await act(async () => toggle("Lyrics")?.click());
    expect(toggle("Up next")?.getAttribute("aria-expanded")).toBe("false");
    expect(toggle("Lyrics")?.getAttribute("aria-expanded")).toBe("true");

    await act(async () => toggle("Lyrics")?.click());
    expect(region()?.classList.contains("hidden")).toBe(true);

    await act(async () => root.unmount());
  });

  it("names the source, and offers More options and Like", async () => {
    const root = await mountExpanded();
    const dialog = document.querySelector('[role="dialog"]');

    expect(dialog?.textContent).toContain("Playing from");
    expect(dialog?.textContent).toContain("Queue");
    expect(
      dialog?.querySelector('button[aria-label="More options"]'),
    ).not.toBeNull();
    expect(
      dialog?.querySelector('button[aria-label^="Like"][aria-pressed="false"]'),
    ).not.toBeNull();

    await act(async () => root.unmount());
  });

  it("moves between the pane tabs with the arrow keys", async () => {
    const root = await mountExpanded();
    const tabs = () => [
      ...document.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    ];
    const press = (key: string) =>
      act(async () => {
        document.activeElement?.dispatchEvent(
          new KeyboardEvent("keydown", { key, bubbles: true }),
        );
      });

    // Roving tabindex: only the selected tab is a tab stop, and only it
    // points at the one panel that is rendered.
    expect(tabs().map((t) => t.tabIndex)).toEqual([0, -1]);
    expect(tabs().map((t) => t.hasAttribute("aria-controls"))).toEqual([
      true,
      false,
    ]);
    expect(
      document.getElementById(tabs()[0].getAttribute("aria-controls") ?? ""),
    ).not.toBeNull();

    await act(async () => tabs()[0].focus());
    await press("ArrowRight");
    expect(tabs()[1].getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tabs()[1]);
    expect(tabs().map((t) => t.tabIndex)).toEqual([-1, 0]);

    await press("ArrowRight");
    expect(tabs()[0].getAttribute("aria-selected")).toBe("true");
    await press("ArrowLeft");
    expect(tabs()[1].getAttribute("aria-selected")).toBe("true");

    await act(async () => root.unmount());
  });

  it("keeps the toggle names stable while aria-pressed carries the state", async () => {
    const root = await mountExpanded();
    for (const label of ["Shuffle", "Loop"]) {
      expect(
        document.querySelector(`button[aria-label="${label}"][aria-pressed]`),
      ).not.toBeNull();
    }
    await act(async () => root.unmount());
  });

  it("switches the pane to Lyrics and shows the empty state when there are none", async () => {
    lyricRequests.length = 0;
    const root = await mountExpanded({ ...track, id: "lyrics-on-demand" });
    const tab = (label: string) =>
      [...document.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find(
        (button) => button.textContent === label,
      );

    expect(tab("Up next")?.getAttribute("aria-selected")).toBe("true");
    expect(tab("Lyrics")?.getAttribute("aria-selected")).toBe("false");
    expect(lyricRequests).toHaveLength(0);

    await act(async () => tab("Lyrics")?.click());
    await waitFor(() => lyricRequests.length > 0);
    expect(tab("Lyrics")?.getAttribute("aria-selected")).toBe("true");
    expect(
      document
        .querySelector('[role="tabpanel"]')
        ?.getAttribute("aria-labelledby"),
    ).toBe(tab("Lyrics")?.id);
    // The stubbed endpoint is offline, so the query fails once it settles.
    await waitFor(
      () =>
        document
          .querySelector('[role="tabpanel"]')
          ?.textContent?.includes("No lyrics available") === true,
    );
    expect(document.querySelector('[role="tabpanel"]')?.textContent).toContain(
      "No lyrics available",
    );

    await act(async () => root.unmount());
  });
});
