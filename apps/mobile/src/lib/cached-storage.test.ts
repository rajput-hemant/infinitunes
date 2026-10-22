import { cachedStorage } from "./cached-storage";

function backing(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  return {
    store,
    getItem: jest.fn((key: string) => store.get(key) ?? null),
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItem: jest.fn(
      (key: string, value: string) => void store.set(key, value),
    ),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
  };
}

describe("cachedStorage", () => {
  it("reads the keychain once, then answers from memory", async () => {
    const inner = backing({ cookie: "a" });
    const storage = cachedStorage(inner);

    expect(await storage.getItemAsync("cookie")).toBe("a");
    expect(await storage.getItemAsync("cookie")).toBe("a");
    expect(storage.getItem("cookie")).toBe("a");

    expect(inner.getItemAsync).toHaveBeenCalledTimes(1);
    expect(inner.getItem).not.toHaveBeenCalled();
  });

  it("serves a write (sign-in, rotation, sign-out) without another read", async () => {
    const inner = backing({ cookie: "a" });
    const storage = cachedStorage(inner);
    await storage.getItemAsync("cookie");

    await storage.setItemAsync("cookie", "b");
    expect(await storage.getItemAsync("cookie")).toBe("b");
    storage.setItem("cookie", "");
    expect(await storage.getItemAsync("cookie")).toBe("");

    expect(inner.setItemAsync).toHaveBeenCalledWith("cookie", "b", undefined);
    expect(inner.setItem).toHaveBeenCalledWith("cookie", "", undefined);
    expect(inner.getItemAsync).toHaveBeenCalledTimes(1);
  });

  it("does not let a read that started before a write overwrite it", async () => {
    const inner = backing({ cookie: "old" });
    let release!: () => void;
    inner.getItemAsync.mockImplementationOnce(async (key) => {
      const value = inner.store.get(key) ?? null;
      await new Promise<void>((resolve) => (release = resolve));
      return value;
    });
    const storage = cachedStorage(inner);

    const stale = storage.getItemAsync("cookie");
    await storage.setItemAsync("cookie", "new");
    release();
    await stale;

    expect(await storage.getItemAsync("cookie")).toBe("new");
  });

  it("does not cache a missing key as a value", async () => {
    const inner = backing();
    const storage = cachedStorage(inner);

    expect(await storage.getItemAsync("cookie")).toBeNull();
    inner.store.set("cookie", "late");

    expect(await storage.getItemAsync("cookie")).toBe("late");
  });
});
