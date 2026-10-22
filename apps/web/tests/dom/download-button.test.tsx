import { afterEach, describe, expect, it, mock } from "bun:test";

import type { Song } from "@infinitunes/types";
import { act } from "react";
import { createRoot } from "react-dom/client";

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

function song(title: string, url = "https://cdn.example/a_96.mp4"): Song {
  return {
    id: "s1",
    title,
    more_info: { download_url: url },
  } as unknown as Song;
}

function stubFetch(response: Response) {
  globalThis.fetch = (() => Promise.resolve(response)) as typeof fetch;
}

afterEach(() => {
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

  it("names the file from the decoded title", async () => {
    stubFetch(new Response("audio", { status: 200 }));
    URL.createObjectURL = () => "blob:x";
    URL.revokeObjectURL = () => {};
    const names: string[] = [];
    const click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
      names.push(this.download);
    };
    try {
      await clickDownload("Rock &amp; Roll");
    } finally {
      HTMLAnchorElement.prototype.click = click;
    }

    expect(names).toEqual(["Rock & Roll.m4a"]);
    expect(toasts).toEqual(["success:Downloaded Rock & Roll"]);
  });

  async function clickMany(songs: Song[]) {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(<DownloadButton songs={songs} />);
    });
    await act(async () =>
      container.querySelector<HTMLButtonElement>("button")?.click(),
    );
    await act(async () => new Promise((r) => setTimeout(r, 50)));
    await act(async () => root.unmount());
    container.remove();
  }

  it("downloads one song at a time and reports partial failure", async () => {
    let inFlight = 0;
    let peak = 0;
    globalThis.fetch = (async (input: string | URL | Request) => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 2));
      inFlight--;
      return String(input).includes("bad")
        ? new Response("no", { status: 500 })
        : new Response("audio", { status: 200 });
    }) as typeof fetch;
    const saved: string[] = [];
    URL.createObjectURL = () => "blob:x";
    URL.revokeObjectURL = () => {};
    const click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
      saved.push(this.download);
    };
    try {
      await clickMany([
        song("A", "https://cdn.example/a_96.mp4"),
        song("B", "https://cdn.example/bad_96.mp4"),
        song("C", "https://cdn.example/c_96.mp4"),
      ]);
    } finally {
      HTMLAnchorElement.prototype.click = click;
    }

    expect(peak).toBe(1);
    expect(saved).toEqual(["A.m4a", "C.m4a"]);
    expect(toasts).toContain("loading:Downloading 1 of 3");
    expect(toasts).toContain("loading:Downloading 3 of 3");
    expect(toasts.at(-1)).toBe("error:Downloaded 2 of 3 songs, 1 failed");
  });

  it("asks before downloading more than ten songs and stops on cancel", async () => {
    let fetched = 0;
    globalThis.fetch = (() => {
      fetched++;
      return Promise.resolve(new Response("audio"));
    }) as typeof fetch;
    const realConfirm = window.confirm;
    window.confirm = () => false;
    try {
      await clickMany(Array.from({ length: 11 }, (_, i) => song(`S${i}`)));
    } finally {
      window.confirm = realConfirm;
    }
    expect(fetched).toBe(0);
  });
});
