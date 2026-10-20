import { describe, expect, it } from "bun:test";

import { createPositionStore } from "@infinitunes/core/react/position-store";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { AudioPlayerProvider } from "react-use-audio-player";

import { ExpandedPlayer } from "../../components/expanded-player";
import { PlayerVolume } from "../../components/player/player-volume";
import { SeekBar } from "../../components/player/seek-bar";

/** The name a screen reader announces: the aria-labelledby text, else aria-label. */
function accessibleName(input: HTMLInputElement) {
  const labelledBy = input.getAttribute("aria-labelledby");
  if (labelledBy) {
    return labelledBy
      .split(" ")
      .map((id) => document.getElementById(id)?.textContent?.trim() ?? "")
      .join(" ")
      .trim();
  }
  return input.getAttribute("aria-label") ?? "";
}

function rangeInput(root: ParentNode): HTMLInputElement {
  const input = root.querySelector<HTMLInputElement>('input[type="range"]');
  if (!input) throw new Error("no range input rendered");
  return input;
}

async function mount(node: React.ReactElement) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => root.render(node));
  return { container, root };
}

async function unmount({
  container,
  root,
}: {
  container: HTMLElement;
  root: ReturnType<typeof createRoot>;
}) {
  await act(async () => root.unmount());
  container.remove();
}

describe("player slider thumbs", () => {
  it("name the seek range input and keep its value text", async () => {
    const mounted = await mount(
      <SeekBar
        position={createPositionStore(10)}
        duration={200}
        showRemainingTime={false}
        onToggleRemainingTime={() => {}}
        onChange={() => {}}
        onCommit={() => {}}
        onStart={() => {}}
      />,
    );

    const input = rangeInput(mounted.container);
    expect(accessibleName(input)).toBe("Seek");
    expect(input?.getAttribute("aria-valuetext")).toBe("00:10 of 03:20");

    await unmount(mounted);
  });

  it("name the volume range input and keep its percent value text", async () => {
    const mounted = await mount(
      <PlayerVolume
        isMuted={false}
        isReady
        volume={0.5}
        onToggleMute={() => {}}
        onVolumeChange={() => {}}
      />,
    );

    const input = rangeInput(mounted.container);
    expect(accessibleName(input)).toBe("Volume");
    expect(input?.getAttribute("aria-valuetext")).toBe("50 percent");

    await unmount(mounted);
  });
});

describe("expanded player sliders", () => {
  it("names every range input in the expanded body", async () => {
    const noop = () => {};
    const router = {
      push: noop,
      replace: noop,
      refresh: noop,
      back: noop,
      forward: noop,
      prefetch: noop,
      hmrRefresh: noop,
    } as never;

    const mounted = await mount(
      <AppRouterContext.Provider value={router}>
        <AudioPlayerProvider>
          <ExpandedPlayer
            open
            onOpenChange={noop}
            track={{
              id: "a",
              queueItemId: "q",
              name: "Song a",
              subtitle: "",
              url: "https://www.jiosaavn.com/song/song-a/a",
              type: "song",
              image: "https://c.saavncdn.com/x-150x150.jpg",
              artists: [],
              download_url: "",
              duration: 100,
            }}
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
      </AppRouterContext.Provider>,
    );

    const inputs = [
      ...document.querySelectorAll<HTMLInputElement>('input[type="range"]'),
    ];
    expect(inputs.length).toBeGreaterThanOrEqual(2);
    const names = inputs.map(accessibleName);
    expect(names).toContain("Seek");
    expect(names).toContain("Volume");

    await unmount(mounted);
  });
});
