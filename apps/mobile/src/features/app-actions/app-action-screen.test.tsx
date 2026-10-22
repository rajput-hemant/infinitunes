import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import { act, screen, waitFor } from "@testing-library/react-native";
import { File } from "expo-file-system";
import { router } from "expo-router";
import { Text } from "react-native";

import { failureStore } from "~/lib/failure";
import { audioPlayer } from "~/playback/audio-engine";
import { playerStore } from "~/playback/player-store";
import { putFile, resetFiles } from "~/test/expo-file-system";
import { renderStack } from "~/test/render";
import { signInAs } from "~/test/session-mock";
import { procedure, trpcError } from "~/test/trpc-mock";
import {
  catalogAnswering,
  favoritesRow,
  songNamed,
  userPlaylist,
} from "~/test/user-library";

import { AppActionScreen, landing } from "./app-action-screen";

const catalog = {
  a: songNamed("a", "First Like"),
  b: songNamed("b", "Second Like"),
  c: songNamed("c", "Third Like"),
};

const initialPlayer = playerStore.getState();

/** The app's routes the action leaves for, and the action route itself. */
function openLink(url: string) {
  return renderStack(
    {
      index: () => <Text>Home</Text>,
      player: () => <Text>Player</Text>,
      queue: () => <Text>Queue</Text>,
      login: () => null,
      "action/[action]": AppActionScreen,
    },
    url,
  );
}

/** The app's stack, inside the router's root navigator, by route name. */
function stackNames(app: Awaited<ReturnType<typeof openLink>>) {
  const stack = app.getRouterState()?.routes[0]?.state;
  return stack?.routes.map((route) => route.name) ?? [];
}

const failureMessage = () => failureStore.getState().current?.message;

const queuedIds = () => playerStore.getState().queue.map((entry) => entry.id);

async function landsOn(
  app: Awaited<ReturnType<typeof openLink>>,
  path: string,
) {
  await waitFor(() => expect(app.getPathname()).toBe(path));
}

beforeEach(() => {
  playerStore.setState(initialPlayer, true);
  failureStore.setState({ current: null });
  procedure("song.details").mockImplementation(catalogAnswering(catalog));
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("action/resume", () => {
  it("starts the restored queue and opens the player", async () => {
    playerStore.getState().playTracks([toSongRow(catalog.a)]);
    playerStore.setState({ started: false });

    const app = await openLink("/action/resume");

    await landsOn(app, "/player");
    expect(playerStore.getState().started).toBe(true);
  });

  it("plays a paused queue on", async () => {
    playerStore.getState().playTracks([toSongRow(catalog.a)]);
    audioPlayer.pause();
    const play = jest.spyOn(audioPlayer, "play");

    const app = await openLink("/action/resume");

    await landsOn(app, "/player");
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("goes back to an open player instead of stacking another", async () => {
    playerStore.getState().playTracks([toSongRow(catalog.a)]);
    playerStore.setState({ started: false });
    const app = await openLink("/player");

    await act(async () => router.push("/action/resume"));

    await waitFor(() => expect(screen.queryByLabelText("Loading")).toBeNull());
    expect(app.getPathname()).toBe("/player");
    const names = stackNames(app);
    expect(names.filter((name) => name === "player")).toHaveLength(1);
    expect(names).not.toContain("action/[action]");
    expect(playerStore.getState().started).toBe(true);
  });

  it("closes the queue sheet over an open player instead of stacking one", async () => {
    playerStore.getState().playTracks([toSongRow(catalog.a)]);
    const app = await openLink("/player");
    await act(async () => router.push("/queue"));
    expect(stackNames(app)).toContain("queue");

    await act(async () => router.push("/action/resume"));

    await waitFor(() => expect(screen.queryByLabelText("Loading")).toBeNull());
    expect(app.getPathname()).toBe("/player");
    const names = stackNames(app);
    expect(names.filter((name) => name === "player")).toHaveLength(1);
    expect(names).not.toContain("queue");
    expect(names).not.toContain("action/[action]");
  });

  it("opens one player for two links that arrive together", async () => {
    playerStore.getState().playTracks([toSongRow(catalog.a)]);
    playerStore.setState({ started: false });
    const app = await openLink("/");
    const error = jest.spyOn(console, "error");

    await act(async () => {
      router.push("/action/resume");
      router.push("/action/resume");
    });
    await waitFor(() => expect(app.getPathname()).toBe("/player"));
    // No action left for a screen an earlier landing took away.
    expect(error.mock.calls).toEqual([]);
    error.mockRestore();

    await waitFor(() => expect(screen.queryByLabelText("Loading")).toBeNull());
    expect(app.getPathname()).toBe("/player");
    const names = stackNames(app);
    expect(names.filter((name) => name === "player")).toHaveLength(1);
    expect(names).not.toContain("action/[action]");
  });

  it("opens one player for two links over an open player", async () => {
    playerStore.getState().playTracks([toSongRow(catalog.a)]);
    const app = await openLink("/player");

    await act(async () => {
      router.push("/action/resume");
      router.push("/action/resume");
    });

    await waitFor(() => expect(screen.queryByLabelText("Loading")).toBeNull());
    expect(app.getPathname()).toBe("/player");
    const names = stackNames(app);
    expect(names.filter((name) => name === "player")).toHaveLength(1);
    expect(names).not.toContain("action/[action]");
  });

  it("lands on Home when nothing is queued", async () => {
    const app = await openLink("/action/resume");

    await landsOn(app, "/");
    expect(screen.getByText("Home")).toBeOnTheScreen();
    expect(playerStore.getState().started).toBe(false);
  });
});

describe("action/play-liked and action/shuffle-liked", () => {
  beforeEach(async () => {
    await act(async () => signInAs("alice"));
    procedure("user.getUserFavorites").mockResolvedValue(
      favoritesRow({ songs: ["a", "b", "c"] }),
    );
  });

  it("plays the liked songs newest like first", async () => {
    const app = await openLink("/action/play-liked");

    await landsOn(app, "/player");
    expect(queuedIds()).toEqual(["c", "b", "a"]);
    expect(playerStore.getState().currentIndex).toBe(0);
  });

  it("shuffles the liked songs", async () => {
    const app = await openLink("/action/shuffle-liked");

    await landsOn(app, "/player");
    expect(queuedIds().toSorted()).toEqual(["a", "b", "c"]);
    expect(playerStore.getState().started).toBe(true);
  });

  it("plays nothing when nothing is liked", async () => {
    procedure("user.getUserFavorites").mockResolvedValue(null);

    const app = await openLink("/action/play-liked");

    await landsOn(app, "/");
    expect(queuedIds()).toEqual([]);
    expect(failureMessage()).toBe("You haven't liked any songs yet");
  });

  it("does not read the likes of a signed-out listener", async () => {
    await act(async () => signInAs(null));

    const app = await openLink("/action/play-liked");

    await landsOn(app, "/");
    expect(procedure("user.getUserFavorites")).not.toHaveBeenCalled();
  });

  it("plays nothing when the library can't be read", async () => {
    procedure("user.getUserFavorites").mockRejectedValue(
      trpcError("INTERNAL_SERVER_ERROR"),
    );

    const app = await openLink("/action/play-liked");

    await landsOn(app, "/");
    expect(queuedIds()).toEqual([]);
  });
});

describe("action/play-playlist", () => {
  beforeEach(async () => {
    await act(async () => signInAs("alice"));
    procedure("user.getPlaylistDetails").mockImplementation(
      async ({ playlistId }) =>
        [
          userPlaylist({ id: "pl-1", name: "Road Trip", songs: ["b", "a"] }),
          userPlaylist({ id: "pl-2", name: "Empty", songs: [] }),
        ].find((playlist) => playlist.id === playlistId) ?? null,
    );
  });

  it("plays the playlist in its own order", async () => {
    const app = await openLink("/action/play-playlist?id=pl-1");

    await landsOn(app, "/player");
    expect(queuedIds()).toEqual(["b", "a"]);
  });

  it("plays nothing when the playlist has no songs", async () => {
    const app = await openLink("/action/play-playlist?id=pl-2");

    await landsOn(app, "/");
    expect(failureMessage()).toBe("Empty has no songs to play");
  });

  it("plays nothing for a playlist the listener doesn't have", async () => {
    const app = await openLink("/action/play-playlist?id=gone");

    await landsOn(app, "/");
    expect(failureMessage()).toBe("That playlist isn't in your library");
    expect(queuedIds()).toEqual([]);
  });
});

describe("action/play-search", () => {
  it("plays the top song for the term", async () => {
    procedure("search.byType").mockResolvedValue({
      total: 1,
      start: 1,
      results: [rawSong({ id: "top" })],
    });

    const app = await openLink("/action/play-search?q=fa9la");

    await landsOn(app, "/player");
    expect(procedure("search.byType")).toHaveBeenCalledWith({
      q: "fa9la",
      type: "songs",
      page: 1,
      n: 1,
    });
    expect(queuedIds()).toEqual(["top"]);
  });

  it("lands back when no song matches", async () => {
    procedure("search.byType").mockRejectedValue(trpcError("NOT_FOUND"));

    const app = await openLink("/action/play-search?q=zzzz");

    await landsOn(app, "/");
    expect(failureMessage()).toBe("No songs found for “zzzz”");
  });

  it("says so for an empty term", async () => {
    const app = await openLink("/action/play-search?q=%20");

    await landsOn(app, "/");
    expect(failureMessage()).toBe("Say a song, artist or album to play");
  });
});

const stack = (...names: string[]) => ({
  key: "root",
  routes: names.map((name, index) => ({ key: `${name}-${index}`, name })),
});
const aimed = (source: string) => ({ source, target: "root" });
const popTo = (source: string) => ({
  type: "POP_TO",
  payload: { name: "player" },
  ...aimed(source),
});

describe("landing", () => {
  it("pops to the player from this screen's place in the stack", () => {
    expect(
      landing(
        stack("(tabs)", "player", "queue", "action"),
        "action-3",
        "player",
      ),
    ).toEqual(popTo("action-3"));
    // A second link queued over this one: still this screen's position.
    expect(
      landing(stack("(tabs)", "action", "action"), "action-1", "player"),
    ).toEqual(popTo("action-1"));
  });

  it("leaves from this screen's place, not from the top of the stack", () => {
    expect(
      landing(stack("(tabs)", "action", "action"), "action-1", "back"),
    ).toEqual({ type: "POP", payload: { count: 1 }, ...aimed("action-1") });
  });

  it("goes Home on a cold start, and does nothing once the screen has left", () => {
    expect(landing(stack("action"), "action-0", "back")).toBe("home");
    expect(landing(stack("(tabs)", "player"), "gone", "player")).toBeNull();
  });
});

it("lands on Home for an unknown action", async () => {
  const app = await openLink("/action/dance");

  await landsOn(app, "/");
  expect(queuedIds()).toEqual([]);
});

it("clears the song cache as a guest, and lands on Home", async () => {
  resetFiles();
  putFile("file:///cache/frequent-songs/song.mp4", 1024 * 1024);
  putFile("file:///downloads/explicit.mp4", 2048);
  const app = await openLink("/player");
  await act(async () => router.push("/action/clear-cache"));
  await landsOn(app, "/");
  expect(new File("file:///downloads/explicit.mp4").exists).toBe(true);
});
