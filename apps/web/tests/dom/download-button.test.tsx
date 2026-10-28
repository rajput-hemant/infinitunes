import { afterEach, describe, expect, it, mock } from "bun:test";

import type { Song } from "@infinitunes/types";
import { act } from "react";
import { createRoot } from "react-dom/client";

import { stubFetch as fetchStub } from "../fetch-stub";

const toasts: string[] = [];
mock.module("sonner", () => ({
  toast: {
    loading: (message: string) => toasts.push(`loading:${message}`),
    success: (message: string) => toasts.push(`success:${message}`),
    error: (message: string) => toasts.push(`error:${message}`),
  },
}));

const { DownloadButton, readAudio } =
  await import("../../components/download-button");

const realFetch = globalThis.fetch;
const realCreateObjectURL = URL.createObjectURL;
const realRevoke = URL.revokeObjectURL;
const realClick = HTMLAnchorElement.prototype.click;

let nextId = 0;

function song(
  title: string,
  url = "https://cdn.example/a_96.mp4",
  artist?: string,
): Song {
  return {
    id: `s${++nextId}`,
    title,
    more_info: {
      download_url: url,
      artistMap: { primary_artists: artist ? [{ name: artist }] : [] },
    },
  } as unknown as Song;
}

const ok = () => Promise.resolve(new Response("audio", { status: 200 }));

afterEach(() => {
  globalThis.fetch = realFetch;
  URL.createObjectURL = realCreateObjectURL;
  URL.revokeObjectURL = realRevoke;
  HTMLAnchorElement.prototype.click = realClick;
  toasts.length = 0;
});

/** Records every anchor download, with the blob it points at. */
function captureSaves() {
  const saved: { name: string; blob: Blob }[] = [];
  let last: Blob | undefined;
  URL.createObjectURL = (blob) => {
    last = blob as Blob;
    return "blob:x";
  };
  URL.revokeObjectURL = () => {};
  HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
    if (last) saved.push({ name: this.download, blob: last });
  };
  return saved;
}

/** A response whose body the test feeds by hand, like a download in flight. */
function streamed(length?: number) {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({
    start: (c) => void (controller = c),
  });
  return {
    response: new Response(body, {
      status: 200,
      headers: length === undefined ? {} : { "content-length": String(length) },
    }),
    push: (bytes: number) => controller.enqueue(new Uint8Array(bytes)),
    end: () => controller.close(),
    error: (reason: unknown) => controller.error(reason),
  };
}

const wait = (ms = 30) =>
  act(async () => new Promise((r) => setTimeout(r, ms)));

async function mount(songs: Song[]) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<DownloadButton songs={songs} />);
  });
  const button = () => container.querySelector<HTMLButtonElement>("button")!;
  return {
    button,
    ring: () => container.querySelector('[role="progressbar"]'),
    click: () => act(async () => button().click()),
    unmount: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
}

async function downloadAll(songs: Song[]) {
  const view = await mount(songs);
  await view.click();
  await wait(80);
  await view.unmount();
}

describe("readAudio", () => {
  it("rejects a response that is not ok instead of saving the error body", async () => {
    globalThis.fetch = fetchStub(() =>
      Promise.resolve(new Response("nope", { status: 404 })),
    );
    await expect(readAudio("https://cdn.example/a.mp4")).rejects.toThrow("404");
  });

  it("reports the share of Content-Length read so far", async () => {
    const stream = streamed(100);
    globalThis.fetch = fetchStub(() => Promise.resolve(stream.response));
    const seen: (number | null)[] = [];

    const read = readAudio("https://cdn.example/a.mp4", undefined, (f) =>
      seen.push(f),
    );
    await wait(5);
    stream.push(25);
    await wait(5);
    stream.push(75);
    stream.end();
    const chunks = await read;

    expect(seen).toEqual([0, 0.25, 1]);
    expect(chunks).toHaveLength(2);
  });

  it("reports an unknown size when there is no Content-Length", async () => {
    const stream = streamed();
    globalThis.fetch = fetchStub(() => Promise.resolve(stream.response));
    const seen: (number | null)[] = [];

    const read = readAudio("https://cdn.example/a.mp4", undefined, (f) =>
      seen.push(f),
    );
    await wait(5);
    stream.push(10);
    stream.end();
    await read;

    expect(seen).toEqual([null]);
  });
});

describe("download button", () => {
  it("saves one song as a single m4a named Artist - Title, with no toast", async () => {
    globalThis.fetch = fetchStub(ok);
    const saved = captureSaves();
    await downloadAll([song("Song: One?", undefined, "Some &amp; Band")]);

    expect(saved.map((s) => s.name)).toEqual(["Some & Band - Song One.m4a"]);
    expect(saved[0]?.blob.type).toBe("audio/mp4");
    expect(toasts).toEqual([]);
  });

  it("names a song without credits by its title alone", async () => {
    globalThis.fetch = fetchStub(ok);
    const saved = captureSaves();
    await downloadAll([song("Rock &amp; Roll / Live")]);

    expect(saved.map((s) => s.name)).toEqual(["Rock & Roll Live.m4a"]);
  });

  it("tells the user when the download fails", async () => {
    globalThis.fetch = fetchStub(() =>
      Promise.resolve(new Response("nope", { status: 500 })),
    );
    const saved = captureSaves();
    const log = console.error;
    console.error = () => {};
    try {
      await downloadAll([song("Song")]);
    } finally {
      console.error = log;
    }

    expect(toasts).toEqual(["error:Download failed. Please try again."]);
    expect(saved).toEqual([]);
  });

  it("tells the user when a song has no download link", async () => {
    let fetched = 0;
    globalThis.fetch = fetchStub(() => {
      fetched++;
      return ok();
    });
    const log = console.error;
    console.error = () => {};
    try {
      await downloadAll([song("Song", "")]);
    } finally {
      console.error = log;
    }

    expect(fetched).toBe(0);
    expect(toasts).toEqual(["error:Download failed. Please try again."]);
  });

  const trio = () => [
    song("A", "https://cdn.example/a_96.mp4", "X"),
    song("B", "https://cdn.example/b_96.mp4", "X"),
    song("C", "https://cdn.example/c_96.mp4", "X"),
  ];

  it("saves several songs one file each, in order, one fetch at a time, with one final toast", async () => {
    let inFlight = 0;
    let peak = 0;
    globalThis.fetch = fetchStub(async () => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 2));
      inFlight--;
      return new Response("audio", { status: 200 });
    });
    const saved = captureSaves();
    await downloadAll(trio());

    expect(peak).toBe(1);
    expect(saved.map((s) => s.name)).toEqual([
      "X - A.m4a",
      "X - B.m4a",
      "X - C.m4a",
    ]);
    expect(toasts).toEqual(["success:Downloaded 3 songs"]);
  });

  it("saves the rest and reports the count when some fail", async () => {
    globalThis.fetch = fetchStub((input) =>
      Promise.resolve(
        String(input).includes("b_96")
          ? new Response("no", { status: 500 })
          : new Response("audio", { status: 200 }),
      ),
    );
    const saved = captureSaves();
    const log = console.error;
    console.error = () => {};
    try {
      await downloadAll(trio());
    } finally {
      console.error = log;
    }

    expect(saved.map((s) => s.name)).toEqual(["X - A.m4a", "X - C.m4a"]);
    expect(toasts).toEqual(["error:Downloaded 2 of 3 songs"]);
  });

  it("errors, and saves nothing, when every song fails", async () => {
    globalThis.fetch = fetchStub(() =>
      Promise.resolve(new Response("no", { status: 500 })),
    );
    const saved = captureSaves();
    const log = console.error;
    console.error = () => {};
    try {
      await downloadAll(trio());
    } finally {
      console.error = log;
    }

    expect(saved).toEqual([]);
    expect(toasts).toEqual(["error:Download failed. Please try again."]);
  });
});

describe("download button progress", () => {
  it("shows the overall progress as a ring and cancels the rest on click", async () => {
    const streams = [streamed(100), streamed(100), streamed(100)];
    const aborted: boolean[] = [];
    let fetched = 0;
    globalThis.fetch = fetchStub((_input, init) => {
      const stream = streams[fetched++]!;
      init?.signal?.addEventListener("abort", () => {
        aborted.push(true);
        stream.error(new DOMException("cancelled", "AbortError"));
      });
      return Promise.resolve(stream.response);
    });
    const saved = captureSaves();

    const view = await mount([
      song("A", "https://cdn.example/a_96.mp4"),
      song("B", "https://cdn.example/b_96.mp4"),
      song("C", "https://cdn.example/c_96.mp4"),
    ]);
    expect(view.ring()).toBeNull();
    expect(view.button().getAttribute("aria-label")).toBe("Download 3 songs");

    await view.click();
    await wait(5);
    expect(view.button().getAttribute("aria-label")).toBe("Cancel download");
    expect(view.ring()?.getAttribute("aria-label")).toBe("Downloading 1 of 3");

    // Half of the first song: (0 finished + 0.5) of 3.
    await act(async () => streams[0]!.push(50));
    await wait(5);
    expect(view.ring()?.getAttribute("aria-valuenow")).toBe("17");

    // The first song lands, the second starts: 1 of 3 done.
    await act(async () => {
      streams[0]!.push(50);
      streams[0]!.end();
    });
    await wait(10);
    expect(saved).toHaveLength(1);
    expect(view.ring()?.getAttribute("aria-label")).toBe("Downloading 2 of 3");
    expect(view.ring()?.getAttribute("aria-valuenow")).toBe("33");

    await view.click();
    await wait(10);

    expect(aborted).toEqual([true]);
    expect(fetched).toBe(2);
    expect(saved).toHaveLength(1);
    expect(view.ring()).toBeNull();
    expect(view.button().getAttribute("aria-label")).toBe("Download 3 songs");
    expect(toasts).toEqual([]);
    await view.unmount();
  });

  it("spins without a value when the size is unknown", async () => {
    const stream = streamed();
    globalThis.fetch = fetchStub(() => Promise.resolve(stream.response));
    captureSaves();

    const view = await mount([song("A"), song("B")]);
    await view.click();
    await wait(5);

    expect(view.ring()?.hasAttribute("aria-valuenow")).toBe(false);

    await act(async () => view.click());
    await wait(10);
    await view.unmount();
  });
});
