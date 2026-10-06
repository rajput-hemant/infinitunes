import { afterEach, describe, expect, it, mock } from "bun:test";

import type { Favorite } from "@infinitunes/db/schema";
import type { MediaType } from "@infinitunes/types";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

mock.module("server-only", () => ({}));
const { LikeButton } = await import("../../components/like-button");

const favorites = (podcasts: string[]): Favorite =>
  ({
    songs: [],
    albums: [],
    playlists: [],
    artists: [],
    podcasts,
  }) as unknown as Favorite;

const roots: Root[] = [];

async function render(props: {
  type: MediaType;
  token: string;
  favourites?: Favorite;
}) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(<LikeButton name="Name" {...props} />);
  });
  return container;
}

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
});

describe("LikeButton", () => {
  it.each(["radio_station", "mix", "episode", "label"] as const)(
    "renders nothing for %s, which has no favorites column",
    async (type) => {
      const container = await render({ type, token: "t1" });

      expect(container.querySelector("button")).toBeNull();
    },
  );

  it("shows a liked show as pressed", async () => {
    const container = await render({
      type: "show",
      token: "show-1",
      favourites: favorites(["show-1"]),
    });

    expect(
      container.querySelector("button")?.getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("shows a show that is not in the favorites as not pressed", async () => {
    const container = await render({
      type: "show",
      token: "show-2",
      favourites: favorites(["show-1"]),
    });

    expect(
      container.querySelector("button")?.getAttribute("aria-pressed"),
    ).toBe("false");
  });
});
