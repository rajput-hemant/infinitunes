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

function song(
  title: string,
  url = "https://cdn.example/a_96.mp4",
  artist?: string,
): Song {
  return {
    id: "s1",
    title,
    more_info: {
      download_url: url,
      artistMap: { primary_artists: artist ? [{ name: artist }] : [] },
    },
  } as unknown as Song;
}

function stubFetch(response: Response) {
  globalThis.fetch = fetchStub(() => Promise.resolve(response));
}

afterEach(() => {
  delete (window as { showSaveFilePicker?: unknown }).showSaveFilePicker;
  globalThis.fetch = realFetch;
  URL.createObjectURL = realCreateObjectURL;
  URL.revokeObjectURL = realRevoke;
  toasts.length = 0;
});

describe("download button", () => {
  it("rejects a response that is not ok instead of saving the error body", async () => {
    stubFetch(new Response("nope", { status: 404 }));
    await expect(readAudio("https://cdn.example/a.mp4")).rejects.toThrow("404");
  });

  async function clickDownload(title: string) {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(<DownloadButton songs={[song(title)]} />);
    });
    await act(async () =>
      container.querySelector<HTMLButtonElement>("button")?.click(),
    );
    await act(async () => new Promise((r) => setTimeout(r, 20)));
    await act(async () => root.unmount());
    container.remove();
  }

  it("tells the user when the download fails", async () => {
    stubFetch(new Response("nope", { status: 500 }));
    const saved: string[] = [];
    URL.createObjectURL = () => {
      saved.push("blob");
      return "blob:x";
    };
    await clickDownload("Song");

    expect(toasts).toEqual(["error:Download failed. Please try again."]);
    expect(saved).toEqual([]);
  });

  async function clickMany(songs: Song[], name?: string) {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(<DownloadButton songs={songs} name={name} />);
    });
    await act(async () =>
      container.querySelector<HTMLButtonElement>("button")?.click(),
    );
    await act(async () => new Promise((r) => setTimeout(r, 80)));
    await act(async () => root.unmount());
    container.remove();
  }

  /** Records every anchor download, with the blob it points at. */
  function captureAnchors() {
    const saved: { name: string; blob: Blob }[] = [];
    let last: Blob | undefined;
    URL.createObjectURL = (blob) => {
      last = blob as Blob;
      return "blob:x";
    };
    URL.revokeObjectURL = () => {};
    const click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
      if (last) saved.push({ name: this.download, blob: last });
    };
    return {
      saved,
      restore: () => {
        HTMLAnchorElement.prototype.click = click;
      },
    };
  }

  /** The entry names of a ZIP, read from its central directory. */
  function zipNames(bytes: Uint8Array): string[] {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const names: string[] = [];
    for (let at = 0; at + 46 <= bytes.length; at++) {
      if (view.getUint32(at, true) !== 0x02014b50) continue;
      const length = view.getUint16(at + 28, true);
      names.push(
        new TextDecoder().decode(bytes.subarray(at + 46, at + 46 + length)),
      );
    }
    return names;
  }

  async function bytesOf(blob: Blob) {
    return new Uint8Array(await blob.arrayBuffer());
  }

  it("saves one song as a single m4a named Artist - Title", async () => {
    stubFetch(new Response("audio", { status: 200 }));
    const { saved, restore } = captureAnchors();
    try {
      await clickDownload("Rock &amp; Roll / Live");
    } finally {
      restore();
    }
    expect(saved.map((s) => s.name)).toEqual(["Rock & Roll Live.m4a"]);
    expect(toasts).toEqual(["success:Downloaded Rock & Roll / Live"]);

    toasts.length = 0;
    stubFetch(new Response("audio", { status: 200 }));
    const again = captureAnchors();
    try {
      await clickMany([song("Song: One?", undefined, "Some &amp; Band")]);
    } finally {
      again.restore();
    }
    expect(again.saved.map((s) => s.name)).toEqual([
      "Some & Band - Song One.m4a",
    ]);
    expect(saved[0]?.blob.type).toBe("audio/mp4");
  });

  const trio = [
    song("A", "https://cdn.example/a_96.mp4"),
    song("B", "https://cdn.example/b_96.mp4"),
    song("A", "https://cdn.example/c_96.mp4"),
  ];

  it("builds one zip, numbered in list order, one song in memory at a time", async () => {
    let inFlight = 0;
    let peak = 0;
    globalThis.fetch = fetchStub(async () => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 2));
      inFlight--;
      return new Response("audio", { status: 200 });
    });
    const { saved, restore } = captureAnchors();
    try {
      await clickMany(trio, "My Playlist: Best/Of");
    } finally {
      restore();
    }

    expect(peak).toBe(1);
    expect(saved.map((s) => s.name)).toEqual(["My Playlist Best Of.zip"]);
    const [file] = saved;
    expect(zipNames(await bytesOf(file!.blob))).toEqual([
      "01 - A.m4a",
      "02 - B.m4a",
      "03 - A.m4a",
    ]);
    expect(toasts).toContain("loading:Downloading 1 of 3");
    expect(toasts.at(-1)).toBe("success:Downloaded 3 songs");
  });

  it("streams the zip into the picked file when the browser allows it", async () => {
    globalThis.fetch = fetchStub(() =>
      Promise.resolve(new Response("audio", { status: 200 })),
    );
    const chunks: Uint8Array[] = [];
    const calls: string[] = [];
    (window as { showSaveFilePicker?: unknown }).showSaveFilePicker =
      (options: { suggestedName: string }) => {
        calls.push(`pick:${options.suggestedName}`);
        return Promise.resolve({
          createWritable: () =>
            Promise.resolve({
              write: (chunk: Uint8Array) => {
                chunks.push(chunk);
                return Promise.resolve();
              },
              close: () => {
                calls.push("close");
                return Promise.resolve();
              },
              abort: () => {
                calls.push("abort");
                return Promise.resolve();
              },
            }),
        });
      };
    const { saved, restore } = captureAnchors();
    try {
      await clickMany(trio, "Album");
    } finally {
      restore();
    }

    expect(calls).toEqual(["pick:Album.zip", "close"]);
    expect(saved).toEqual([]);
    const all = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
    let at = 0;
    for (const chunk of chunks) {
      all.set(chunk, at);
      at += chunk.length;
    }
    expect(zipNames(all)).toEqual(["01 - A.m4a", "02 - B.m4a", "03 - A.m4a"]);
  });

  it("skips failed songs, still saves the rest and reports the count", async () => {
    globalThis.fetch = fetchStub((input) =>
      Promise.resolve(
        String(input).includes("bad")
          ? new Response("no", { status: 500 })
          : new Response("audio", { status: 200 }),
      ),
    );
    const { saved, restore } = captureAnchors();
    try {
      await clickMany(
        [
          song("A", "https://cdn.example/a_96.mp4"),
          song("B", "https://cdn.example/bad_96.mp4"),
          song("C", "https://cdn.example/c_96.mp4"),
        ],
        "Mix",
      );
    } finally {
      restore();
    }

    expect(saved.map((s) => s.name)).toEqual(["Mix.zip"]);
    expect(zipNames(await bytesOf(saved[0]!.blob))).toEqual([
      "01 - A.m4a",
      "03 - C.m4a",
    ]);
    expect(toasts.at(-1)).toBe("error:Downloaded 2 of 3 songs, 1 failed");
  });

  it("saves nothing and errors when every song fails", async () => {
    globalThis.fetch = fetchStub(() =>
      Promise.resolve(new Response("no", { status: 500 })),
    );
    const { saved, restore } = captureAnchors();
    try {
      await clickMany(trio, "Mix");
    } finally {
      restore();
    }

    expect(saved).toEqual([]);
    expect(toasts.at(-1)).toBe("error:Download failed. Please try again.");
  });

  it("does nothing when the user cancels the save picker", async () => {
    let fetched = 0;
    globalThis.fetch = fetchStub(() => {
      fetched++;
      return Promise.resolve(new Response("audio"));
    });
    (window as { showSaveFilePicker?: unknown }).showSaveFilePicker = () =>
      Promise.reject(new DOMException("cancelled", "AbortError"));
    await clickMany(trio, "Mix");

    expect(fetched).toBe(0);
    expect(toasts).toEqual([]);
  });
});
