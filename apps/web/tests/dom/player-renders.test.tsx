import { afterEach, describe, expect, it, mock } from "bun:test";

import type { Favorite } from "@infinitunes/db/schema";
import { getDownloadLink } from "@infinitunes/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import {
  Profiler,
  act,
  useEffect,
  type ComponentProps,
  type ReactNode,
} from "react";
import { createRoot, type Root } from "react-dom/client";
import superjson from "superjson";

import { useIsPlayerInit } from "../../hooks/use-store";

let position = 0;
let advancing = false;
const loads: string[] = [];
const recorded: string[] = [];

const audio = {
  load(src: string) {
    loads.push(src);
  },
  isPlaying: true,
  togglePlayPause() {},
  getPosition: () => (advancing ? (position += 0.05) : position),
  isLoading: false,
  duration: 200,
  isLooping: false,
  mute() {},
  unmute() {},
  isMuted: false,
  volume: 0.75,
  setVolume() {},
  seek() {},
  isReady: true,
  player: null,
};

mock.module("react-use-audio-player", () => ({
  useAudioPlayerContext: () => audio,
  AudioPlayerProvider: ({ children }: { children: ReactNode }) => children,
}));
mock.module("../../lib/history-actions", () => ({
  recordPlay: (item: { id: string }) => void recorded.push(item.id),
}));

// Counts renders of a prop-less child of the bar: it re-renders only when the
// whole `PlayerInner` does.
let queueRenders = 0;
const realQueue = await import("../../components/queue");
// Bun rebinds module namespaces on mock, so keep the original component.
const RealQueue = realQueue.Queue;
mock.module("../../components/queue", () => ({
  ...realQueue,
  Queue: (props: ComponentProps<typeof RealQueue>) => {
    queueRenders++;
    return <RealQueue {...props} />;
  },
}));

const { Player } = await import("../../components/player");
const { api } = await import("../../lib/trpc/client");

const queue = ["a", "b", "c"].map((id, i) => ({
  queueItemId: `q${i}`,
  id,
  name: `Song ${id}`,
  subtitle: "",
  url: `https://www.jiosaavn.com/song/song-${id}/${id}`,
  type: "song",
  image: "https://c.saavncdn.com/x-150x150.jpg",
  artists: [],
  download_url: "",
  duration: 200,
}));

const queryClient = new QueryClient();
const trpcClient = api.createClient({
  links: [httpBatchLink({ url: "/api/trpc", transformer: superjson })],
});
const router = {
  push() {},
  replace() {},
  refresh() {},
  back() {},
  forward() {},
  prefetch() {},
} as never;

const roots: Root[] = [];

// happy-dom does not pace animation frames, so frames are stepped by hand.
let frameCallbacks = new Map<number, FrameRequestCallback>();
let nextFrameId = 1;
globalThis.requestAnimationFrame = (cb) => {
  frameCallbacks.set(nextFrameId, cb);
  return nextFrameId++;
};
globalThis.cancelAnimationFrame = (id) => void frameCallbacks.delete(id);
window.requestAnimationFrame = globalThis.requestAnimationFrame;
window.cancelAnimationFrame = globalThis.cancelAnimationFrame;

async function stepFrames(count: number) {
  for (let i = 0; i < count; i++) {
    const due = [...frameCallbacks.values()];
    frameCallbacks = new Map();
    await act(async () => due.forEach((cb) => cb(performance.now())));
  }
}

async function commitsOver(frames: number, isAdvancing: boolean) {
  localStorage.setItem("queue", JSON.stringify(queue));
  localStorage.setItem("current_song_index", "0");
  advancing = false;
  position = 0;
  let commits = 0;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(
      <AppRouterContext.Provider value={router}>
        <SearchParamsContext.Provider value={new URLSearchParams()}>
          <api.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
              <Profiler id="player" onRender={() => void commits++}>
                <Player />
              </Profiler>
            </QueryClientProvider>
          </api.Provider>
        </SearchParamsContext.Provider>
      </AppRouterContext.Provider>,
    );
  });
  const settled = commits;
  queueRenders = 0;
  advancing = isAdvancing;
  await stepFrames(frames);
  advancing = false;
  return { commits: commits - settled, container };
}

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
});

describe("player re-renders", () => {
  it("does not commit while the playhead is paused", async () => {
    const { commits } = await commitsOver(60, false);

    expect(commits).toBe(0);
  });

  // PF-8: the frame loop writes to a position store, so only the seek bar and
  // time label subscribe. Before, `Queue` re-rendered on every frame.
  it("keeps the rest of the bar still while the playhead advances", async () => {
    const frames = 60;
    const { commits, container } = await commitsOver(frames, true);

    expect(commits).toBeLessThanOrEqual(frames * 2);
    expect(queueRenders).toBeLessThanOrEqual(2);
    // The playhead still moves: the time label follows it.
    expect(container.textContent).toMatch(/00:0[23].*03:20/);
  });
});

const playableQueue = [
  {
    queueItemId: "pq0",
    id: "a",
    name: "Song a",
    subtitle: "Artist a",
    url: "https://www.jiosaavn.com/song/song-a/a",
    type: "song",
    image: "https://c.saavncdn.com/x-150x150.jpg",
    artists: [],
    download_url: "https://cdn/a-low.mp3,https://cdn/a-high.mp3",
    duration: 200,
  },
];

// The init flag is an in-memory atom (default false), so the player under test
// would never load or record without priming it through the real store hook.
function PrimePlayer() {
  const [, setInit] = useIsPlayerInit();
  useEffect(() => {
    setInit(true);
    return () => setInit(false);
  }, [setInit]);
  return null;
}

async function mountPlayer(options?: {
  queue?: typeof playableQueue;
  favorites?: Favorite;
}) {
  loads.length = 0;
  recorded.length = 0;
  document.body.replaceChildren();
  localStorage.setItem(
    "queue",
    JSON.stringify(options?.queue ?? playableQueue),
  );
  localStorage.setItem("current_song_index", "0");
  localStorage.removeItem("active_radio_session");
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(
      <AppRouterContext.Provider value={router}>
        <SearchParamsContext.Provider value={new URLSearchParams()}>
          <api.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
              <PrimePlayer />
              <Player favorites={options?.favorites} />
            </QueryClientProvider>
          </api.Provider>
        </SearchParamsContext.Provider>
      </AppRouterContext.Provider>,
    );
  });
  return container;
}

async function menuLabels() {
  const triggers = document.querySelectorAll<HTMLButtonElement>(
    '[aria-label="More Options"]',
  );
  await act(async () => {
    triggers[triggers.length - 1]?.click();
  });
  return [...document.querySelectorAll('[role="menuitem"]')].map(
    (el) => el.textContent,
  );
}

// Behavior replacement for the player-playback hook-wiring source test:
// the mounted player loads the resolved source and records the entry.
describe("player track wiring", () => {
  it("loads the resolved source and records the current entry once", async () => {
    await mountPlayer();

    expect(loads).toEqual([
      getDownloadLink(playableQueue[0].download_url, "excellent"),
    ]);
    expect(recorded).toEqual(["a"]);
  });
});

// Behavior replacement for the player-a11y and playerbar a11y-labels source
// tests: the mounted player announces, labels and names values for real.
describe("player a11y", () => {
  it("announces the current track in a polite live region", async () => {
    await mountPlayer();

    const output = document.querySelector('output[aria-live="polite"]');
    expect(output?.textContent).toContain("Now playing Song a");
  });

  it("labels sliders via labelledby and names values on the range inputs", async () => {
    await mountPlayer();

    expect(document.querySelector('[aria-label="Seek"]')).toBeNull();
    expect(document.querySelector('[aria-label="Volume"]')).toBeNull();
    const names = [...document.querySelectorAll("[aria-labelledby]")].map(
      (el) =>
        document.getElementById(el.getAttribute("aria-labelledby") ?? "")
          ?.textContent,
    );
    expect(names).toContain("Seek");
    expect(names).toContain("Volume");
    const valueTexts = [
      ...document.querySelectorAll('input[type="range"]'),
    ].map((el) => el.getAttribute("aria-valuetext"));
    expect(valueTexts.some((text) => text?.includes(" of "))).toBe(true);
    expect(valueTexts.some((text) => text?.includes("percent"))).toBe(true);
  });

  it("toggles the queue pane from the bar button and the q shortcut", async () => {
    await mountPlayer();

    const button = () =>
      document.querySelector<HTMLButtonElement>('button[aria-label="Queue"]');
    const pane = () => document.querySelector("aside#player-queue");
    expect(button()?.getAttribute("aria-expanded")).toBe("false");
    expect(pane()?.hasAttribute("inert")).toBe(true);

    await act(async () => button()?.click());
    expect(button()?.getAttribute("aria-expanded")).toBe("true");
    expect(pane()?.hasAttribute("inert")).toBe(false);

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "q" }));
    });
    expect(button()?.getAttribute("aria-expanded")).toBe("false");
    expect(pane()?.hasAttribute("inert")).toBe(true);
  });

  it("marks shuffle and loop as toggle buttons", async () => {
    await mountPlayer();

    for (const label of ["Shuffle", "Loop", "Mute"]) {
      const button = document.querySelector(`button[aria-label="${label}"]`);
      expect(button?.getAttribute("aria-pressed")).toBe("false");
    }
  });

  it("shows an accessible More button when the queue is empty", async () => {
    await mountPlayer({ queue: [] });

    expect(document.querySelector('[aria-label="More"]')).not.toBeNull();
  });
});

// Behavior replacement for the playerbar Player-to-TileMoreButton favorites
// source test: the mounted player forwards favorites to the row menu.
describe("player favorite plumbing", () => {
  it("offers Remove From Favourite for a favorited current song", async () => {
    await mountPlayer({ favorites: { songs: ["a"] } as unknown as Favorite });

    expect(await menuLabels()).toContain("Remove From Favourite");
  });

  it("offers Add To Favourite when the current song is not a favorite", async () => {
    await mountPlayer({ favorites: { songs: [] } as unknown as Favorite });

    const labels = await menuLabels();
    expect(labels).toContain("Add To Favourite");
    expect(labels).not.toContain("Remove From Favourite");
  });
});
