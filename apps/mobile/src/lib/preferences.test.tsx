import { act, renderHook } from "@testing-library/react-native";
import Storage from "expo-sqlite/kv-store";

import {
  preferencesStore,
  useCatalogLang,
  usePreferences,
} from "./preferences";

const initial = preferencesStore.getState();
const stored = () => {
  const json = Storage.getItemSync("preferences");
  return json ? (JSON.parse(json) as { state: Record<string, unknown> }) : null;
};

beforeEach(() => preferencesStore.setState(initial, true));

describe("preferences", () => {
  it("defaults to the web's: best streaming and artwork, the catalog's own languages", () => {
    expect(preferencesStore.getState()).toMatchObject({
      streamQuality: "excellent",
      downloadQuality: "excellent",
      imageQuality: "high",
      languages: [],
    });
  });

  it("persists the choices and never the setter functions", () => {
    const { setStreamQuality, setLanguages } = preferencesStore.getState();
    setStreamQuality("low");
    setLanguages(["tamil", "english"]);

    const saved = stored();
    expect(saved?.state).toEqual({
      streamQuality: "low",
      downloadQuality: "excellent",
      imageQuality: "high",
      languages: ["tamil", "english"],
    });
  });

  it("restores the saved choices on launch", async () => {
    preferencesStore.getState().setImageQuality("low");
    const saved = Storage.getItemSync("preferences");
    preferencesStore.setState(initial, true);
    await Storage.setItemAsync("preferences", saved ?? "");

    await preferencesStore.persist.rehydrate();

    expect(preferencesStore.getState().imageQuality).toBe("low");
    // Actions survive a rehydrate: they are not part of what was saved.
    expect(typeof preferencesStore.getState().setImageQuality).toBe("function");
  });

  it("re-renders a reader of one slice only when that slice changes", async () => {
    let renders = 0;
    await renderHook(() => {
      renders += 1;
      return usePreferences((p) => p.downloadQuality);
    });
    const before = renders;

    await act(async () => preferencesStore.getState().setImageQuality("low"));
    expect(renders).toBe(before);

    await act(async () =>
      preferencesStore.getState().setDownloadQuality("low"),
    );
    expect(renders).toBe(before + 1);
  });
});

describe("useCatalogLang", () => {
  it("is undefined for the catalog's default, not an empty string", async () => {
    const { result } = await renderHook(() => useCatalogLang());
    expect(result.current).toBeUndefined();
  });

  it("is the comma-joined languages in the order picked, and follows changes", async () => {
    const { result } = await renderHook(() => useCatalogLang());

    await act(async () =>
      preferencesStore.getState().setLanguages(["tamil", "english"]),
    );
    expect(result.current).toBe("tamil,english");

    await act(async () => preferencesStore.getState().setLanguages([]));
    expect(result.current).toBeUndefined();
  });
});
