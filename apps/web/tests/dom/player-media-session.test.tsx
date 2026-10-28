import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";

import { useIsPlayerInit } from "../../hooks/use-store";

// A Howl that behaves like Howler's html5 mode where it matters here: its own
// `howlPaused` flag only changes through its own play()/pause(), the element is
// reachable at `_sounds[0]._node`, and nothing tells it when the element is
// paused or resumed from outside.
type Handler = (...args: unknown[]) => void;
type FakeOptions = { src: string; autoplay?: boolean; onend?: Handler };

class FakeHowl {
  static all: FakeHowl[] = [];
  howlPaused = true;
  loadState = "loaded";
  seekPos = 0;
  looping = false;
  nodePaused = true;
  nodeEnded = false;
  node = document.createElement("audio");
  _sounds = [{ _node: this.node }];
  handlers = new Map<string, Set<Handler>>();

  constructor(options: FakeOptions) {
    FakeHowl.all.push(this);
    Object.defineProperty(this.node, "paused", { get: () => this.nodePaused });
    Object.defineProperty(this.node, "ended", { get: () => this.nodeEnded });
    if (options.onend) this.on("end", options.onend);
    if (options.autoplay) this.play();
  }

  native(type: string) {
    this.node.dispatchEvent(new Event(type));
  }
  /** What the browser does when something other than Howler pauses it. */
  externalPause() {
    this.nodePaused = true;
    this.native("pause");
  }
  externalPlay() {
    this.nodePaused = false;
    this.native("play");
    this.native("playing");
  }

  on(event: string, fn: Handler) {
    const set = this.handlers.get(event) ?? new Set();
    set.add(fn);
    this.handlers.set(event, set);
    return this;
  }
  off(event: string, fn?: Handler) {
    if (fn) this.handlers.get(event)?.delete(fn);
    else this.handlers.delete(event);
    return this;
  }
  emit(event: string) {
    for (const fn of [...(this.handlers.get(event) ?? [])]) fn();
  }

  play() {
    if (!this.howlPaused) return;
    this.howlPaused = false;
    this.nodePaused = false;
    this.native("play");
    this.native("playing");
    this.emit("play");
  }
  pause() {
    if (!this.howlPaused) {
      this.howlPaused = true;
      this.nodePaused = true;
      this.native("pause");
    }
    this.emit("pause");
  }
  stop() {
    this.howlPaused = true;
    this.seekPos = 0;
    this.emit("stop");
  }
  unload() {
    this.loadState = "unloaded";
    this.nodePaused = true;
    // Howler releases the element and the browser reports the pause late.
    queueMicrotask(() => this.native("pause"));
  }
  /** The browser reaches the end: `pause`, then Howler's own `end`. */
  finish() {
    this.nodePaused = true;
    this.nodeEnded = true;
    this.native("pause");
    this.howlPaused = true;
    this.emit("end");
  }
  state() {
    return this.loadState;
  }
  playing() {
    return !this.howlPaused;
  }
  seek(to?: number) {
    if (to === undefined) return this.seekPos;
    this.seekPos = to;
    this.emit("seek");
    return this;
  }
  loop(on?: boolean) {
    if (on === undefined) return this.looping;
    this.looping = on;
    return this;
  }
  duration() {
    return 200;
  }
  rate() {
    return 1;
  }
  volume() {
    return 0.75;
  }
  mute() {
    return false;
  }
}

mock.module("howler", () => ({ Howl: FakeHowl, Howler: {} }));
mock.module("../../lib/history-actions", () => ({ recordPlay: () => {} }));

// Imported after the mock above so the library binds to the fake Howl.
const { AudioPlayerProvider } = await import("react-use-audio-player");
const { Player } = await import("../../components/player");

// The Media Session the browser would provide.
const handlers = new Map<string, ((details?: unknown) => void) | null>();
const positions: MediaPositionState[] = [];
const session = {
  metadata: null as { title: string; artist: string } | null,
  playbackState: "none",
  setActionHandler(action: string, handler: ((d?: unknown) => void) | null) {
    handlers.set(action, handler);
  },
  setPositionState(state: MediaPositionState) {
    positions.push(state);
  },
};

let generation = 0;
const makeQueue = () =>
  ["a", "b", "c"].map((id, i) => ({
    queueItemId: `q${i}`,
    id,
    name: `Song ${id}`,
    subtitle: `Artist ${id}`,
    url: `https://www.jiosaavn.com/song/song-${id}/${id}`,
    type: "song",
    image: `https://c.saavncdn.com/${id}-150x150.jpg`,
    artists: [],
    download_url: `https://cdn/${generation}${id}-low.mp3,https://cdn/${generation}${id}-high.mp3`,
    duration: 200,
  }));

const router = {
  push() {},
  replace() {},
  refresh() {},
  back() {},
  forward() {},
  prefetch() {},
} as never;

function PrimePlayer() {
  const [, setInit] = useIsPlayerInit();
  useEffect(() => {
    setInit(true);
    return () => setInit(false);
  }, [setInit]);
  return null;
}

const roots: Root[] = [];
let container: HTMLElement;

async function mount() {
  document.body.replaceChildren();
  localStorage.setItem("queue", JSON.stringify(makeQueue()));
  localStorage.setItem("current_song_index", "0");
  localStorage.removeItem("active_radio_session");
  container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(
      <AppRouterContext.Provider value={router}>
        <SearchParamsContext.Provider value={new URLSearchParams()}>
          <AudioPlayerProvider>
            <PrimePlayer />
            <Player />
          </AudioPlayerProvider>
        </SearchParamsContext.Provider>
      </AppRouterContext.Provider>,
    );
  });
  return root;
}

const button = (label: string) =>
  container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
const nowPlaying = () => container.querySelector("output")?.textContent ?? "";
const current = () => FakeHowl.all.at(-1) as FakeHowl;
const press = (label: string) => act(async () => void button(label)?.click());
const mediaKey = (action: string, details?: unknown) =>
  act(async () => void handlers.get(action)?.(details));

beforeEach(() => {
  generation++;
  FakeHowl.all = [];
  handlers.clear();
  positions.length = 0;
  session.metadata = null;
  session.playbackState = "none";
  Object.defineProperty(navigator, "mediaSession", {
    value: session,
    configurable: true,
  });
  Object.defineProperty(globalThis, "MediaMetadata", {
    value: function MediaMetadata(this: object, init: object) {
      Object.assign(this, init);
    },
    configurable: true,
    writable: true,
  });
});

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
  // The unmounted Howl reports its pause late; let it land.
  await act(async () => void (await Promise.resolve()));
});

describe("player follows the real audio element", () => {
  it("shows Play when the element is paused from outside", async () => {
    await mount();
    expect(button("Pause")).not.toBeNull();

    await act(async () => current().externalPause());

    expect(button("Play")).not.toBeNull();
    expect(button("Pause")).toBeNull();
    // Howler agrees too, so the button's next press plays instead of no-oping.
    expect(current().playing()).toBe(false);
    await press("Play");
    expect(current().playing()).toBe(true);
    expect(button("Pause")).not.toBeNull();
  });

  it("shows Pause when the element is resumed from outside", async () => {
    await mount();
    await press("Pause");
    expect(button("Play")).not.toBeNull();

    await act(async () => current().externalPlay());

    expect(button("Pause")).not.toBeNull();
    expect(current().playing()).toBe(true);
  });

  it("does not read the end of a track as a pause", async () => {
    await mount();
    const first = current();

    // `pause` arrives before Howler's `end`; the next track must follow once.
    await act(async () => first.finish());

    expect(nowPlaying()).toContain("Song b");
    expect(button("Pause")).not.toBeNull();
  });

  it("ignores a late pause from the unloaded previous track", async () => {
    await mount();
    const first = current();
    await press("Next");
    expect(nowPlaying()).toContain("Song b");
    const second = current();
    expect(second).not.toBe(first);

    await act(async () => first.native("pause"));

    expect(second.playing()).toBe(true);
    expect(button("Pause")).not.toBeNull();
  });
});

describe("media session", () => {
  it("pauses and plays from the media keys, and reports playbackState", async () => {
    await mount();
    expect(session.playbackState).toBe("playing");

    await mediaKey("pause");
    expect(button("Play")).not.toBeNull();
    expect(current().playing()).toBe(false);
    expect(session.playbackState).toBe("paused");

    await mediaKey("play");
    expect(button("Pause")).not.toBeNull();
    expect(session.playbackState).toBe("playing");
  });

  it("moves the queue like the buttons, with the current repeat and shuffle state", async () => {
    await mount();
    expect(nowPlaying()).toContain("Song a");

    // Without repeat, Previous on the first entry stays put; with the playlist
    // looped it wraps to the last one. A handler that kept the state from
    // mount would not wrap.
    await mediaKey("previoustrack");
    expect(nowPlaying()).toContain("Song a");
    await press("Loop");
    await mediaKey("previoustrack");
    expect(nowPlaying()).toContain("Song c");

    await mediaKey("nexttrack");
    expect(nowPlaying()).toContain("Song a");
    await mediaKey("nexttrack");
    expect(nowPlaying()).toContain("Song b");
  });

  it("seeks to the requested time and stops at the start", async () => {
    await mount();

    await mediaKey("seekto", { seekTime: 42 });
    expect(current().seek()).toBe(42);

    await mediaKey("stop");
    expect(current().playing()).toBe(false);
    expect(current().seek()).toBe(0);
    expect(button("Play")).not.toBeNull();
  });

  it("publishes metadata for the current track and updates it on change", async () => {
    await mount();
    expect(session.metadata).toMatchObject({
      title: "Song a",
      artist: "Artist a",
    });
    const artwork = (
      session.metadata as unknown as {
        artwork: { src: string; sizes: string }[];
      }
    ).artwork;
    expect(artwork.map((a) => a.sizes)).toEqual(["150x150", "500x500"]);
    expect(artwork[1]?.src).toBe("https://c.saavncdn.com/a-500x500.jpg");

    await press("Next");

    expect(session.metadata).toMatchObject({
      title: "Song b",
      artist: "Artist b",
    });
  });

  it("tells the OS the duration and position once they are known", async () => {
    await mount();

    expect(positions.at(-1)).toEqual({
      duration: 200,
      position: 0,
      playbackRate: 1,
    });
    expect(positions.every((p) => (p.position ?? 0) <= (p.duration ?? 0))).toBe(
      true,
    );
  });

  it("removes its handlers and clears the session on unmount", async () => {
    const root = await mount();
    expect(handlers.get("play")).toBeTypeOf("function");

    await act(async () => root.unmount());
    roots.length = 0;

    for (const action of [
      "play",
      "pause",
      "previoustrack",
      "nexttrack",
      "seekto",
      "stop",
    ]) {
      expect(handlers.get(action)).toBeNull();
    }
    expect(session.metadata).toBeNull();
    expect(session.playbackState).toBe("none");
  });

  it("is inert in a browser without Media Session", async () => {
    // @ts-expect-error simulating a browser that lacks it
    delete navigator.mediaSession;

    await mount();
    await press("Pause");

    expect(button("Play")).not.toBeNull();
    expect(handlers.size).toBe(0);
  });
});
