import { describe, expect, it } from "bun:test";

import type { Queue as QueueItem } from "@infinitunes/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { AudioPlayerProvider } from "react-use-audio-player";
import superjson from "superjson";

import { ExpandedPlayer } from "../../components/expanded-player";
import { createPositionStore } from "../../lib/position-store";
import { api } from "../../lib/trpc/client";

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

const queryClient = new QueryClient();
const trpcClient = api.createClient({
  links: [httpBatchLink({ url: "/api/trpc", transformer: superjson })],
});

const noop = () => {};

describe("expanded player sheet", () => {
  it("renders exactly one Close button", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <SearchParamsContext.Provider value={new URLSearchParams()}>
          <api.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
              <AudioPlayerProvider>
                <ExpandedPlayer
                  open
                  onOpenChange={noop}
                  track={track}
                  position={createPositionStore(0)}
                  duration={100}
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
            </QueryClientProvider>
          </api.Provider>
        </SearchParamsContext.Provider>,
      );
    });

    const closes = document.querySelectorAll(
      '[role="dialog"] button[aria-label="Close"]',
    );
    expect(closes).toHaveLength(1);

    await act(async () => root.unmount());
  });
});
