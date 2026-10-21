import Storage from "expo-sqlite/kv-store";

/** A fresh copy of the store, as at app start, with the OS call spied on. */
function startApp() {
  const started: {
    setColorScheme: jest.SpyInstance;
    store: typeof import("./appearance-store");
  }[] = [];
  jest.isolateModules(() => {
    const {
      Appearance,
    }: typeof import("react-native") = require("react-native");
    const setColorScheme = jest
      .spyOn(Appearance, "setColorScheme")
      .mockImplementation(() => {});
    started.push({ setColorScheme, store: require("./appearance-store") });
  });
  const [app] = started;
  if (!app) throw new Error("the store module did not load");
  return app;
}

describe("appearance store", () => {
  it("reapplies the saved mode when the app starts", async () => {
    await Storage.setItemAsync(
      "appearance",
      JSON.stringify({ state: { mode: "dark" }, version: 0 }),
    );

    const { setColorScheme, store } = startApp();

    expect(store.appearanceStore.getState().mode).toBe("dark");
    expect(setColorScheme).toHaveBeenCalledWith("dark");
  });

  it("follows the system until a mode is chosen", async () => {
    await Storage.removeItemAsync("appearance");

    const { setColorScheme, store } = startApp();

    expect(store.appearanceStore.getState().mode).toBe("system");
    expect(setColorScheme).toHaveBeenCalledWith("auto");
  });

  it("saves a chosen mode for the next launch", async () => {
    await Storage.removeItemAsync("appearance");
    const first = startApp();

    first.store.appearanceStore.getState().setMode("light");
    await Promise.resolve();

    const second = startApp();
    expect(second.store.appearanceStore.getState().mode).toBe("light");
    expect(second.setColorScheme).toHaveBeenCalledWith("light");
  });
});
