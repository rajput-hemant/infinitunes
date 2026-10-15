import { afterEach, describe, expect, it, mock } from "bun:test";

import {
  AppRouterContext,
  type AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { setInputValue } from "./set-input-value";
import { waitFor } from "./wait-for";

const renamePlaylist = mock(
  async (_id: string, input: { name: string; description?: string }) => ({
    ok: true,
    data: { name: input.name },
  }),
);
mock.module("../../lib/actions", () => ({ renamePlaylist }));

const { RenamePlaylistDialog } =
  await import("../../components/playlist/rename-playlist-dialog");

const router: AppRouterInstance = {
  back() {},
  forward() {},
  refresh() {},
  push() {},
  replace() {},
  prefetch() {},
};
const playlist = { id: "p1", name: "Road trip", description: "Long drives" };
const roots: Root[] = [];

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
  document.body.replaceChildren();
  renamePlaylist.mockClear();
});

async function mount(open: boolean) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () =>
    root.render(
      <AppRouterContext.Provider value={router}>
        <RenamePlaylistDialog
          playlist={playlist}
          open={open}
          onOpenChange={() => {}}
        />
      </AppRouterContext.Provider>,
    ),
  );
}

const nameInput = () =>
  document.querySelector<HTMLInputElement>('input[type="text"]');

describe("rename playlist dialog", () => {
  it("renders no form while closed", async () => {
    await mount(false);
    await act(async () => new Promise((r) => setTimeout(r, 20)));
    expect(nameInput()).toBeNull();
  });

  it("loads the form on open, prefilled, and saves the new name", async () => {
    await mount(true);
    await waitFor(() => nameInput() !== null);
    expect(nameInput()?.value).toBe("Road trip");

    await act(async () =>
      setInputValue(nameInput() as HTMLInputElement, "Night drive"),
    );
    const save = [...document.querySelectorAll("button")].find(
      (b) => b.textContent === "Save",
    );
    await act(async () => save?.click());
    await waitFor(() => renamePlaylist.mock.calls.length > 0);

    expect(renamePlaylist.mock.calls[0]?.[0]).toBe("p1");
    expect(renamePlaylist.mock.calls[0]?.[1]?.name).toBe("Night drive");
  });
});
