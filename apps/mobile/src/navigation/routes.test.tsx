import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react-native";
import { router, Stack } from "expo-router";
import { renderRouter } from "expo-router/testing-library";
import type { RenderRouterResult } from "expo-router/testing-library";
import { Platform, Pressable, Text } from "react-native";
import { toast } from "sonner-native";

import { redirectSystemPath } from "~/app/+native-intent";
import { signInAs } from "~/test/session-mock";

import { useOpenEntity } from "./use-open-entity";

const ARTIST_URL =
  "https://www.jiosaavn.com/artist/flipperachi-songs/LnMfdXjMGl0_";
const ALBUM_PATH = "/album/udta-teer/LHgqn,SRpyA_";

function OpenArtist() {
  const openEntity = useOpenEntity();
  return (
    <Pressable onPress={() => openEntity("artist", ARTIST_URL)}>
      <Text>Go to Artist</Text>
    </Pressable>
  );
}

describe("app routes", () => {
  it("opens a detail screen inside the tab it was opened from", async () => {
    const app = await renderRouter("./src/app", {
      initialUrl: redirectSystemPath({ path: "/search" }),
    });
    expect(app.getSegments()).toEqual(["(tabs)", "(search)", "search"]);

    await act(async () => router.push(ALBUM_PATH));

    expect(app.getPathname()).toBe(ALBUM_PATH);
    expect(app.getSegments()).toEqual([
      "(tabs)",
      "(search)",
      "album",
      "[name]",
      "[token]",
    ]);
    await act(async () => router.back());
    expect(app.getPathname()).toBe("/search");
  });

  it.each([
    ["an album", ALBUM_PATH, ["album", "[name]", "[token]"]],
    [
      "a show at a season",
      "/show/the-ranveer-show/2/mXtDJ4Yd2Sw_",
      ["show", "[name]", "[season]", "[token]"],
    ],
    [
      "an artist tab",
      "/artist/flipperachi/LnMfdXjMGl0_/songs",
      ["artist", "[name]", "[token]", "[tab]"],
    ],
    ["the top albums list", "/album", ["album"]],
    ["the charts", "/chart", ["chart"]],
  ])("opens %s at the web's path", async (_, initialUrl, segments) => {
    const app = await renderRouter("./src/app", { initialUrl });

    expect(app.getPathname()).toBe(initialUrl);
    expect(app.getSegments()).toEqual(["(tabs)", "(home)", ...segments]);
  });

  it("opens the radio list as its own tab, and a station inside it", async () => {
    const app = await renderRouter("./src/app", { initialUrl: "/radio" });
    expect(app.getSegments()).toEqual(["(tabs)", "(radio)", "radio"]);

    await act(async () => router.push("/radio/hindi-station/station-1"));
    expect(app.getSegments()).toEqual([
      "(tabs)",
      "(radio)",
      "radio",
      "[name]",
      "[token]",
    ]);
  });

  it("keeps the library tab and the settings screens at their old URLs", async () => {
    // Signed in, so the account screens stay open. Before the first render:
    // `act` with no root mounted, or a sign-in under a mounted app, breaks
    // `renderRouter` for the rest of the file.
    signInAs("alice");
    const app = await renderRouter("./src/app", { initialUrl: "/library" });
    expect(app.getSegments()).toEqual(["(tabs)", "(library)", "library"]);

    // Settings is no longer a tab: it is pushed onto the current one.
    await act(async () => router.push("/settings"));
    expect(app.getSegments()).toEqual(["(tabs)", "(library)", "settings"]);
    await act(async () => router.back());
    expect(app.getPathname()).toBe("/library");

    for (const path of ["/profile", "/password", "/delete-account"] as const) {
      await act(async () => router.push(path));
      expect(app.getPathname()).toBe(path);
    }
  });

  it("opens a settings link over Home", async () => {
    const app = await renderRouter("./src/app", { initialUrl: "/settings" });

    expect(app.getSegments()).toEqual(["(tabs)", "(home)", "settings"]);
    await act(async () => router.back());
    expect(app.getPathname()).toBe("/");
  });
});

/** Every tab renders at once; only the selected one takes touches. */
async function selectedTab(app: RenderRouterResult) {
  const tab = await waitFor(() => {
    const [selected] = app.container.queryAll(
      (node) =>
        typeof node.props.nativeID === "string" &&
        node.props.nativeID.startsWith("expo-router-tab:") &&
        node.props.pointerEvents === "box-none",
    );
    if (!selected) throw new Error("No tab is selected");
    return selected;
  });
  return within(tab);
}

describe("the root screens' header", () => {
  it("pushes Settings onto the current tab", async () => {
    const app = await renderRouter("./src/app", { initialUrl: "/radio" });

    await fireEvent.press(
      await (await selectedTab(app)).findByRole("button", { name: "Settings" }),
    );
    expect(app.getSegments()).toEqual(["(tabs)", "(radio)", "settings"]);
  });

  it("opens the profile from the avatar when signed in", async () => {
    signInAs("alice", { name: "Alice" });
    const app = await renderRouter("./src/app", { initialUrl: "/library" });

    const profile = await (
      await selectedTab(app)
    ).findByRole("button", {
      name: "Profile",
    });
    expect(within(profile).getByText("A")).toBeOnTheScreen();
    await fireEvent.press(profile);
    expect(app.getSegments()).toEqual(["(tabs)", "(library)", "profile"]);
  });

  it("offers Sign In instead while signed out", async () => {
    const app = await renderRouter("./src/app", { initialUrl: "/radio" });

    const tab = await selectedTab(app);
    expect(tab.queryByRole("button", { name: "Profile" })).toBeNull();
    await fireEvent.press(await tab.findByRole("button", { name: "Sign in" }));
    expect(app.getPathname()).toBe("/login");
  });

  it("adds Home's language picker", async () => {
    const app = await renderRouter("./src/app", { initialUrl: "/" });

    await fireEvent.press(
      await (
        await selectedTab(app)
      ).findByRole("button", { name: "Languages" }),
    );
    expect(app.getPathname()).toBe("/languages");
  });

  it("has no search action on iOS, which has the search tab", async () => {
    const app = await renderRouter("./src/app", { initialUrl: "/library" });

    const tab = await selectedTab(app);
    await tab.findByRole("button", { name: "Settings" });
    expect(tab.queryByRole("button", { name: "Search" })).toBeNull();
  });
});

describe("on Android", () => {
  beforeEach(() => jest.replaceProperty(Platform, "OS", "android"));
  afterEach(() => jest.restoreAllMocks());

  it("keeps Home's app bar to three actions, Languages leading the chips", async () => {
    const app = await renderRouter("./src/app", { initialUrl: "/" });

    const home = await selectedTab(app);
    await home.findByRole("button", { name: "Settings" });
    expect(home.getByRole("button", { name: "Search" })).toBeOnTheScreen();
    expect(home.getByRole("button", { name: "Sign in" })).toBeOnTheScreen();
    // The only Languages control is the chip, not a fourth app bar button.
    const [chip, ...others] = home.getAllByRole("button", {
      name: "Languages",
    });
    expect(others).toHaveLength(0);
    await fireEvent.press(chip!);
    expect(app.getPathname()).toBe("/languages");
  });

  it("pushes search onto the current tab from the app bar", async () => {
    const app = await renderRouter("./src/app", { initialUrl: "/library" });

    await fireEvent.press(
      await (await selectedTab(app)).findByRole("button", { name: "Search" }),
    );
    expect(app.getSegments()).toEqual(["(tabs)", "(library)", "search"]);
  });

  it("opens a search link (Google Assistant) in Home with its query", async () => {
    const app = await renderRouter("./src/app", {
      initialUrl: redirectSystemPath({ path: "infinitunes://search?q=siri" }),
    });

    expect(app.getSegments()).toEqual(["(tabs)", "(home)", "search"]);
    expect(app.getSearchParams()).toEqual({ q: "siri" });
  });
});

/** The tab bar's native "you tapped a disabled tab" event, as UIKit sends it. */
function tapCreateTab(app: RenderRouterResult) {
  const [host] = app.container.queryAll(
    (node) => typeof node.props.onTabSelectionPrevented === "function",
  );
  if (!host) throw new Error("No native tab host rendered");
  return act(async () =>
    fireEvent(host, "tabSelectionPrevented", {
      nativeEvent: { preventedScreenKey: "create", provenance: 0 },
    }),
  );
}

describe("the Create tab", () => {
  it("is a tab the native bar never selects", async () => {
    const app = await renderRouter("./src/app", { initialUrl: "/" });

    const [create] = app.container.queryAll(
      (node) =>
        node.props.screenKey === "create" &&
        "preventNativeSelection" in node.props,
    );
    expect(create?.props.preventNativeSelection).toBe(true);
  });

  it("opens the New Playlist sheet over the tab that stays selected", async () => {
    signInAs("alice");
    const app = await renderRouter("./src/app", { initialUrl: "/library" });

    await tapCreateTab(app);
    expect(app.getPathname()).toBe("/create-playlist");

    await act(async () => router.back());
    expect(app.getSegments()).toEqual(["(tabs)", "(library)", "library"]);
  });

  it("asks a signed-out listener to sign in, staying put", async () => {
    const app = await renderRouter("./src/app", { initialUrl: "/library" });

    await tapCreateTab(app);
    expect(jest.mocked(toast.warning)).toHaveBeenCalledWith(
      "Sign in to continue",
      expect.objectContaining({
        description: "You need an account to make playlists.",
      }),
    );
    expect(app.getSegments()).toEqual(["(tabs)", "(library)", "library"]);
  });
});

type StateNode = { routes?: { name: string; state?: StateNode }[] };

/** How many routes in the navigation tree are called `name`. */
function routesNamed(state: StateNode | undefined, name: string): number {
  return (state?.routes ?? []).reduce(
    (count, route) =>
      count + (route.name === name ? 1 : 0) + routesNamed(route.state, name),
    0,
  );
}

describe("the player", () => {
  it("opens once however often it is pushed", async () => {
    const app = await renderRouter("./src/app", { initialUrl: "/" });

    await act(async () => router.push("/player"));
    await act(async () => router.push("/player"));
    await act(async () => router.replace("/player"));

    expect(routesNamed(app.getRouterState(), "player")).toBe(1);
    await act(async () => router.back());
    expect(app.getPathname()).toBe("/");
  });
});

describe("useOpenEntity", () => {
  const tree = {
    _layout: () => <Stack />,
    "(tabs)/_layout": () => <Stack />,
    "(tabs)/index": () => null,
    "(tabs)/album/[name]/[token]": OpenArtist,
    "(tabs)/artist/[name]/[token]/[tab]": () => null,
    player: OpenArtist,
  };

  it("pushes onto the tab, keeping the screen it came from", async () => {
    const app = await renderRouter(tree, { initialUrl: "/" });
    await act(async () => router.push(ALBUM_PATH));

    await fireEvent.press(screen.getByText("Go to Artist"));
    expect(app.getPathname()).toBe("/artist/flipperachi/LnMfdXjMGl0_/songs");

    await act(async () => router.back());
    expect(app.getPathname()).toBe(ALBUM_PATH);
  });

  it("closes the player first, opening the screen in the tab below", async () => {
    const app = await renderRouter(tree, { initialUrl: "/" });
    await act(async () => router.push("/player"));

    await fireEvent.press(screen.getByText("Go to Artist"));
    expect(app.getPathname()).toBe("/artist/flipperachi/LnMfdXjMGl0_/songs");

    await act(async () => router.back());
    expect(app.getPathname()).toBe("/");
  });
});
