import { afterEach, expect, it, mock } from "bun:test";

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { useCurrentSongIndex, useQueue } from "../../hooks/use-store";
import { playerSeek, playhead } from "../../lib/playhead";

const { Lyrics, lyricsSnippet } =
  await import("../../app/(root)/song/[name]/[token]/_components/lyrics");

const synced = [
  { time: 1, text: "First" },
  { time: 5, text: "Second" },
];
const base = { source: "lrclib", copyright: null } as const;

let root: Root | undefined;
afterEach(async () => {
  await act(async () => root?.unmount());
  document.body.innerHTML = "";
  playerSeek.current = undefined;
  playhead.set(0);
});

function Playing({ id }: { id: string }) {
  const [, setQueue] = useQueue();
  const [, setIndex] = useCurrentSongIndex();
  React.useEffect(() => {
    setQueue([{ queueItemId: "q", id, name: "Song" }] as never);
    setIndex(0);
  }, [id, setQueue, setIndex]);
  return null;
}

async function render(ui: React.ReactElement) {
  const host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root?.render(ui));
  return host;
}
const open = (host: HTMLElement) =>
  act(async () => host.querySelector("button")?.click());

it("previews the first lines and expands to plain text with the copyright", async () => {
  const host = await render(
    <Lyrics
      id="a"
      lyrics={{
        synced: null,
        plain: "one\ntwo\n\nthree\nfour\nfive",
        source: "jiosaavn",
        copyright: "(c) Label",
      }}
    />,
  );
  expect(host.textContent).toContain("Read More...");
  expect(host.textContent).toContain("four");
  expect(host.textContent).not.toContain("five");
  await open(host);
  expect(host.textContent).not.toContain("Read More...");
  expect(host.querySelector('[aria-label="Synced lyrics"]')).toBeNull();
  expect(host.textContent).toContain("five");
  expect(host.textContent).toContain("(c) Label");
});

it("previews synced lines and hides the copyright for lrclib", async () => {
  expect(lyricsSnippet({ ...base, synced, plain: null })).toBe("First\nSecond");
  const host = await render(
    <Lyrics
      id="a"
      lyrics={{ ...base, synced, plain: "x", copyright: "(c)" }}
    />,
  );
  await open(host);
  expect(
    host.querySelectorAll('[aria-label="Synced lyrics"] button'),
  ).toHaveLength(0);
  expect(host.querySelectorAll('[aria-label="Synced lyrics"] p')).toHaveLength(
    2,
  );
  expect(host.textContent).not.toContain("(c)");
});

it("follows the playhead and seeks only while this song is the current track", async () => {
  const seek = mock((seconds: number) => playhead.set(seconds));
  playerSeek.current = seek;
  const host = await render(
    <>
      <Playing id="other" />
      <Lyrics id="a" lyrics={{ ...base, synced, plain: null }} />
    </>,
  );
  await open(host);
  const lines = () => host.querySelectorAll<HTMLElement>("section button");
  expect(lines()).toHaveLength(0);
  await act(async () => playhead.set(6));
  expect(host.querySelector('[aria-current="true"]')).toBeNull();
  await act(async () => lines()[0]?.click());
  expect(seek).not.toHaveBeenCalled();

  await act(async () =>
    root?.render(
      <>
        <Playing id="a" />
        <Lyrics id="a" lyrics={{ ...base, synced, plain: null }} />
      </>,
    ),
  );
  expect(lines()[1]?.getAttribute("aria-current")).toBe("true");
  await act(async () => lines()[0]?.click());
  expect(seek).toHaveBeenCalledWith(1);
  expect(lines()[0]?.getAttribute("aria-current")).toBe("true");
});
