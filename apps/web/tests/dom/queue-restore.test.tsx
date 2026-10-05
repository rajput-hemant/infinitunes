import { describe, expect, it } from "bun:test";

import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";

const { useCurrentSongIndex, useQueue } = await import("../../hooks/use-store");

function Probe() {
  const [queue] = useQueue();
  const [index] = useCurrentSongIndex();
  return <output>{queue[index]?.name ?? "empty"}</output>;
}

describe("persisted queue", () => {
  it("is restored from localStorage when the player mounts", async () => {
    localStorage.setItem(
      "queue",
      JSON.stringify([
        { queueItemId: "a", id: "1", name: "First" },
        { id: "2", name: "Legacy without queueItemId" },
      ]),
    );
    localStorage.setItem("current_song_index", "1");

    const container = document.createElement("div");
    container.innerHTML = renderToString(<Probe />);
    document.body.append(container);
    let root!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(container, <Probe />);
    });

    expect(container.querySelector("output")?.textContent).toBe(
      "Legacy without queueItemId",
    );
    await act(async () => root.unmount());
  });
});
