import { describe, expect, it } from "bun:test";

import type { Queue } from "@infinitunes/types";
import { Play } from "lucide-react";
import { act } from "react";
import { createRoot } from "react-dom/client";

import { TileMoreMobilePopup as TileMoreMobile } from "../../components/song-list/more-button-mobile-popup";

const item: Queue = {
  queueItemId: "q1",
  id: "song-1",
  name: "Song 1",
  subtitle: "",
  url: "https://www.jiosaavn.com/song/song-1/abc",
  type: "song",
  image: "https://c.saavncdn.com/x-150x150.jpg",
  artists: [],
  download_url: "",
  duration: 100,
};

const button = (label: string) =>
  [...document.querySelectorAll<HTMLButtonElement>("button")].find(
    (b) => b.textContent?.trim() === label,
  );

// The panel that holds the Back button is the share panel.
const sharePanel = () => button("Back")?.parentElement;
const mainPanel = () => button("Play Song Now")?.parentElement;

describe("phone more-menu share panel", () => {
  it("keeps only the visible panel reachable and resets when the drawer closes", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <TileMoreMobile
          item={item}
          showAlbum={false}
          entries={[{ label: "Play Song Now", onClick: () => {}, icon: Play }]}
        />,
      );
    });
    await act(async () =>
      container
        .querySelector<HTMLButtonElement>('[aria-label="More options"]')
        ?.click(),
    );

    expect(button("Play Song Now")?.textContent).toBe("Play Song Now");
    expect(sharePanel()?.hasAttribute("inert")).toBe(true);
    expect(sharePanel()?.getAttribute("aria-hidden")).toBe("true");
    expect(mainPanel()?.hasAttribute("inert")).toBe(false);

    await act(async () => button("Share")?.click());
    expect(sharePanel()?.hasAttribute("inert")).toBe(false);
    expect(mainPanel()?.hasAttribute("inert")).toBe(true);
    expect(mainPanel()?.getAttribute("aria-hidden")).toBe("true");

    await act(async () => button("Cancel")?.click());
    await act(async () => new Promise((r) => setTimeout(r, 100)));
    await act(async () =>
      container
        .querySelector<HTMLButtonElement>('[aria-label="More options"]')
        ?.click(),
    );

    expect(sharePanel()?.hasAttribute("inert")).toBe(true);
    expect(mainPanel()?.hasAttribute("inert")).toBe(false);

    await act(async () => root.unmount());
    container.remove();
  });
});

describe("row share target", () => {
  it("shares the song's own page, not the page the row sits on", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <TileMoreMobile item={item} showAlbum={false} entries={[]} />,
      );
    });
    await act(async () =>
      container
        .querySelector<HTMLButtonElement>('[aria-label="More options"]')
        ?.click(),
    );

    const facebook = [...document.querySelectorAll("a")].find((a) =>
      a.textContent?.includes("Facebook"),
    );
    expect(facebook?.getAttribute("href")).toContain(
      encodeURIComponent("/song/song-1/abc"),
    );

    await act(async () => root.unmount());
    container.remove();
  });
});
