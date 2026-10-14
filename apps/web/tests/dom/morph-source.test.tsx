import { afterEach, describe, expect, it } from "bun:test";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { MorphSource } from "../../components/view-transition/morph-source";
import { morphName } from "../../lib/view-transition";

const roots: Root[] = [];
const containers: HTMLElement[] = [];

async function mount(markup: string) {
  const host = document.createElement("div");
  host.innerHTML = markup;
  document.body.append(host);
  const mountPoint = document.createElement("div");
  document.body.append(mountPoint);
  const root = createRoot(mountPoint);
  roots.push(root);
  containers.push(host, mountPoint);
  await act(async () => root.render(<MorphSource />));
  return host;
}

afterEach(async () => {
  for (const root of roots.splice(0)) await act(async () => root.unmount());
  for (const el of containers.splice(0)) el.remove();
});

const card = (type: string, href: string) => `
  <div data-morph="${type}">
    <div data-morph-art><a href="${href}" id="${type}-link">art</a></div>
  </div>`;

describe("MorphSource", () => {
  it("names only the artwork of the card that was clicked", async () => {
    const host = await mount(
      card("album", "/album/some-name/tok123") +
        card("playlist", "/playlist/other/tok456"),
    );
    const albumArt = host.querySelectorAll<HTMLElement>("[data-morph-art]")[0];
    const playlistArt =
      host.querySelectorAll<HTMLElement>("[data-morph-art]")[1];

    await act(async () => {
      host
        .querySelector("#album-link")
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 }));
    });
    expect(albumArt?.style.viewTransitionName).toBe(
      morphName("album", "tok123"),
    );
    expect(playlistArt?.style.viewTransitionName).toBe("");

    await act(async () => {
      host
        .querySelector("#playlist-link")
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 }));
    });
    expect(albumArt?.style.viewTransitionName).toBe("");
    expect(playlistArt?.style.viewTransitionName).toBe(
      morphName("playlist", "tok456"),
    );
  });

  it("ignores modified clicks that open another tab", async () => {
    const host = await mount(card("album", "/album/n/tok1"));
    await act(async () => {
      host
        .querySelector("#album-link")
        ?.dispatchEvent(
          new MouseEvent("click", { bubbles: true, button: 0, metaKey: true }),
        );
    });
    expect(
      host.querySelector<HTMLElement>("[data-morph-art]")?.style
        .viewTransitionName,
    ).toBe("");
  });
});

describe("morphName", () => {
  it("is a valid identifier for any token", () => {
    expect(morphName("album", "a b/c")).toBe("art-album-a_b_c");
  });
});
