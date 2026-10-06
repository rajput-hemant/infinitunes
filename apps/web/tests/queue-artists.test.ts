import { describe, expect, it } from "bun:test";

import { toQueue } from "@infinitunes/types";
import type { Song } from "@infinitunes/types";

const artist = (id: string, name: string, role: string) => ({
  id,
  name,
  role,
  perma_url: `https://x/artist/${id}`,
});

describe("toQueue", () => {
  it("lists an artist once when the upstream repeats it per role", () => {
    const song = {
      id: "s1",
      title: "Hey Kharari",
      subtitle: "",
      perma_url: "https://x/song/hey-kharari/s1",
      type: "song",
      image: "https://x/50x50.jpg",
      more_info: {
        duration: "162",
        artistMap: {
          artists: [
            artist("a1", "Sadhu Tiwari", "music"),
            artist("a1", "Sadhu Tiwari", "lyricist"),
            artist("a2", "Rishi Pathak", "singer"),
          ],
        },
      },
    } as unknown as Song;

    expect(toQueue(song).artists.map((a) => a.id)).toEqual(["a1", "a2"]);
  });
});
