import { afterEach, describe, expect, it, mock } from "bun:test";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { Profiler, act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import superjson from "superjson";

let position = 0;
let advancing = false;

const audio = {
  load() {},
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
mock.module("../../lib/history-actions", () => ({ recordPlay: () => {} }));

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

  // Measured baseline (PF-5): every animation frame re-renders the whole bar,
  // two commits per frame. Raise this only knowingly; lowering it is the goal.
  it("commits at most twice per frame while the playhead advances", async () => {
    const frames = 60;
    const { commits } = await commitsOver(frames, true);

    expect(commits).toBeLessThanOrEqual(frames * 2);
  });
});
