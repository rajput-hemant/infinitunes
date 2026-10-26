import { afterEach, describe, expect, it } from "bun:test";

import { claimOptimisticOwner } from "../src/optimistic-owner";
import {
  favoriteKey,
  peekFavorite,
  resetFavoriteOverlay,
  toggleFavorite,
} from "../src/react/optimistic-favorite";

afterEach(resetFavoriteOverlay);

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("toggleFavorite", () => {
  it("builds one key per item", () => {
    expect(favoriteKey("song", "abc")).toBe("song:abc");
  });

  it("sends only the latest intent while a write is in flight", async () => {
    const sent: boolean[] = [];
    const releases: (() => void)[] = [];
    const send = (liked: boolean) => {
      sent.push(liked);
      return new Promise<void>((resolve) => releases.push(resolve));
    };
    const key = favoriteKey("song", "a");

    toggleFavorite({ key, serverLiked: false, send });
    toggleFavorite({ key, serverLiked: false, send });
    toggleFavorite({ key, serverLiked: false, send });
    expect(sent).toEqual([true]);

    releases[0]?.();
    await settle();
    // Three clicks net to "liked": the first write already said so.
    expect(sent).toEqual([true]);
  });

  it("follows up when the intent changed during the write", async () => {
    const sent: boolean[] = [];
    const releases: (() => void)[] = [];
    const send = (liked: boolean) => {
      sent.push(liked);
      return new Promise<void>((resolve) => releases.push(resolve));
    };
    const key = favoriteKey("song", "b");

    toggleFavorite({ key, serverLiked: false, send });
    toggleFavorite({ key, serverLiked: false, send });
    releases[0]?.();
    await settle();

    expect(sent).toEqual([true, false]);
  });

  it("does not retry a rejected write", async () => {
    const sent: boolean[] = [];
    const send = (liked: boolean) => {
      sent.push(liked);
      return Promise.reject(new Error("offline"));
    };

    toggleFavorite({ key: favoriteKey("song", "c"), serverLiked: false, send });
    await settle();

    expect(sent).toEqual([true]);
  });

  it("does not send the previous owner's queued intent after an account switch", async () => {
    claimOptimisticOwner("alice");
    const sent: string[] = [];
    let release = () => {};
    let cookie = "alice";
    const send = (liked: boolean) => {
      sent.push(`${cookie}:${liked}`);
      return new Promise<void>((resolve) => {
        release = resolve;
      });
    };
    const key = favoriteKey("song", "shared");
    toggleFavorite({ key, serverLiked: false, send });
    toggleFavorite({ key, serverLiked: false, send });

    cookie = "bob";
    claimOptimisticOwner("bob");
    // Bob can write the same key while Alice's original request completes.
    toggleFavorite({ key, serverLiked: false, send: async () => {} });
    release();
    await settle();

    expect(sent).toEqual(["alice:true"]);
  });
});

describe("peekFavorite", () => {
  it("shows the pending intent, the server's state without one, and the rollback", async () => {
    const key = favoriteKey("song", "a");
    expect(peekFavorite(key, true)).toBe(true);

    let reject = () => {};
    toggleFavorite({
      key,
      serverLiked: true,
      send: () => new Promise((_, no) => (reject = () => no(new Error("x")))),
    });
    expect(peekFavorite(key, true)).toBe(false);

    reject();
    await settle();
    expect(peekFavorite(key, true)).toBe(true);
  });
});
