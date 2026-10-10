import { afterEach, describe, expect, it, mock } from "bun:test";

import { act } from "react";
import { createRoot } from "react-dom/client";

import { setInputValue } from "./set-input-value";

const createNewPlaylist = mock(async (input: { name: string }) => ({
  ok: true,
  data: { name: input.name },
}));
mock.module("../../lib/actions", () => ({ createNewPlaylist }));

const { NewPlaylistForm } =
  await import("../../components/playlist/new-playlist-form");

function nameInput() {
  return document.querySelector<HTMLInputElement>('input[type="text"]');
}

// The form loads on first open, so wait for it to mount.
async function untilNameInput() {
  for (let i = 0; i < 50 && !nameInput(); i++) {
    await act(async () => new Promise((r) => setTimeout(r, 10)));
  }
}

describe("new playlist dialog", () => {
  it("opens empty every time, so a stale name cannot be submitted twice", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <NewPlaylistForm>
          <button type="button">Open</button>
        </NewPlaylistForm>,
      );
    });

    await act(async () => container.querySelector("button")?.click());
    await untilNameInput();
    const first = nameInput();
    expect(first?.value).toBe("");
    await act(async () => setInputValue(first as HTMLInputElement, "Road"));
    expect(nameInput()?.value).toBe("Road");

    const cancel = [...document.querySelectorAll("button")].find(
      (b) => b.textContent === "Cancel",
    );
    expect(cancel?.type).toBe("button");
    await act(async () => cancel?.click());
    await act(async () => new Promise((r) => setTimeout(r, 50)));
    expect(nameInput()).toBeNull();

    await act(async () => container.querySelector("button")?.click());
    await untilNameInput();
    expect(nameInput()?.value).toBe("");
    expect(createNewPlaylist).not.toHaveBeenCalled();

    await act(async () => root.unmount());
    container.remove();
  });
});

describe("new playlist dialog, lazy form", () => {
  it("opens the form after it loads and focuses the name field", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <NewPlaylistForm>
          <button type="button">Open</button>
        </NewPlaylistForm>,
      );
    });

    expect(nameInput()).toBeNull();
    await act(async () => container.querySelector("button")?.click());
    await untilNameInput();

    expect(
      document.querySelector('[data-slot="dialog-content"]'),
    ).not.toBeNull();
    expect(document.activeElement).toBe(nameInput());

    await act(async () => root.unmount());
    container.remove();
  });
});

describe("new playlist sheet", () => {
  const realMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = realMatchMedia;
  });

  it("presents as a bottom sheet below 768px and still opens empty", async () => {
    window.matchMedia = ((query: string) => ({
      matches: true,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;

    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <NewPlaylistForm>
          <button type="button">Open</button>
        </NewPlaylistForm>,
      );
    });

    await act(async () => container.querySelector("button")?.click());
    await untilNameInput();
    expect(document.querySelector('[data-slot="drawer-popup"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="dialog-content"]')).toBeNull();
    expect(nameInput()?.value).toBe("");

    await act(async () => root.unmount());
    container.remove();
  });
});
