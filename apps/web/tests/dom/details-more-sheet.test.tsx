import { afterEach, describe, expect, it, mock } from "bun:test";

import type { SongRowItem } from "@infinitunes/types";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

let isDownloading = false;
const download = mock(() => {});
mock.module("next/navigation", () => ({
  usePathname: () => "/album/x/abc",
  useRouter: () => ({ push() {} }),
}));
mock.module("sonner", () => ({
  toast: Object.assign(() => {}, { success() {}, error() {}, info() {} }),
}));
mock.module("~/lib/trpc/vanilla", () => ({ trpc: {} }));
mock.module("~/lib/actions", () => ({ addSongsToPlaylist() {} }));
mock.module("~/components/download-button", () => ({
  useDownloadSongs: () => ({ isDownloading, download }),
}));

const { MoreButtonPopup } =
  await import("../../components/details-header/more-button-popup");
const { MoreButton } =
  await import("../../components/details-header/more-button");

const song = {
  id: "s1",
  name: "Song",
  subtitle: "",
  url: "https://www.jiosaavn.com/song/s/abc",
  type: "song",
  image: "https://c.saavncdn.com/x-150x150.jpg",
  artists: [],
  primaryArtists: [],
  download_url: "",
  duration: 1,
} as SongRowItem;

const base = {
  type: "album" as const,
  image: song.image,
  name: "Album",
  subtitle: "Sub",
  songs: [song],
};

const roots: Root[] = [];
async function mount(ui: React.ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => root.render(ui));
  return container;
}

const button = (label: string) =>
  [...document.querySelectorAll<HTMLButtonElement>("button")].find(
    (b) => b.textContent?.trim() === label,
  );
const wait = (ms = 100) =>
  act(async () => new Promise((r) => setTimeout(r, ms)));

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
  document.body.replaceChildren();
  isDownloading = false;
  download.mockClear();
});

const names = { share: "s", mobile: "m", desktop: "d" };

describe("details header phone more sheet", () => {
  it("closes the sheet when an entry is chosen", async () => {
    const c = await mount(
      <MoreButtonPopup {...base} names={names} openOnMount="mobile" />,
    );
    expect(button("Cancel")).toBeDefined();

    await act(async () => button("Add to Queue")?.click());
    await wait();

    expect(button("Cancel")).toBeUndefined();
    expect(c.querySelector("[data-deferred=m]")).not.toBeNull();
  });

  it("keeps Download listed but disabled and busy while a download runs", async () => {
    isDownloading = true;
    await mount(
      <MoreButtonPopup {...base} names={names} openOnMount="mobile" />,
    );

    const entry = button("Download");
    expect(entry).toBeDefined();
    expect(entry?.disabled).toBe(true);
    expect(entry?.getAttribute("aria-busy")).toBe("true");
  });
});

describe("details header shell", () => {
  it("renders closed Share and More triggers without loading a popup", async () => {
    const c = await mount(<MoreButton {...base} />);

    const labels = [...c.querySelectorAll("button")].map((b) =>
      b.getAttribute("aria-label"),
    );
    expect(labels).toEqual(["Share", "More options", "More options"]);
    expect(document.querySelector("[role=dialog], [role=menu]")).toBeNull();
  });
});
