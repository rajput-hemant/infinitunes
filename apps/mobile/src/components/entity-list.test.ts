import type { SongRowItem } from "@infinitunes/types";

import { cardItems, entityListKey, songItems } from "./entity-list";

const song = (id: string) => ({ id }) as SongRowItem;

describe("entityListKey", () => {
  it("keeps a song that repeats in the list under distinct keys", () => {
    const queue = [song("a"), song("b"), song("a")];
    const keys = songItems(queue).map(entityListKey);

    expect(new Set(keys).size).toBe(queue.length);
  });

  it("keys a song row apart from a card with the same id", () => {
    const [row] = songItems([song("a")]);
    const [card] = cardItems([{ id: "a" } as never]);

    expect(entityListKey(row!)).not.toBe(entityListKey(card!));
  });
});
