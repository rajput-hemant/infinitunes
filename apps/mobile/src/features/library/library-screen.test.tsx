import { resetFavoriteOverlay } from "@infinitunes/core/react/optimistic-favorite";
import { resetPlaylistOverlay } from "@infinitunes/core/react/optimistic-playlists";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { router as appRouter } from "expo-router";
import { Alert, Platform } from "react-native";
import type { AlertButton } from "react-native";

import { CONTENT_REVEAL } from "~/components/skeletons";
import { renderStack, chooseMenuAction } from "~/test/render";
import { signInAs } from "~/test/session-mock";
import { procedure } from "~/test/trpc-mock";
import {
  catalogAnswering,
  deferred,
  favoritesRow,
  songNamed,
  userPlaylist,
  playlistSummary,
} from "~/test/user-library";

import { EditPlaylistScreen } from "./edit-playlist-screen";
import { LibraryScreen } from "./library-screen";
import { NewPlaylistScreen } from "./new-playlist-screen";

const roadTrip = userPlaylist({
  id: "pl-1",
  name: "Road Trip",
  songs: ["a", "b"],
});

function renderLibraryTab() {
  return renderStack({
    index: LibraryScreen,
    login: () => null,
    "create-playlist": NewPlaylistScreen,
    "me/edit-playlist/[id]": EditPlaylistScreen,
    "me/liked-songs": () => null,
    "me/playlist/[id]": () => null,
  });
}

/** Confirms the delete dialog the way a tap on its "Delete" button does. */
async function confirmDelete(alert: jest.SpyInstance) {
  const buttons: AlertButton[] = alert.mock.calls[0]![2]!;
  const confirm = buttons.find(({ text }) => text === "Delete");
  await act(async () => confirm?.onPress?.());
}

async function createPlaylistNamed(name: string) {
  const router = await renderLibraryTab();
  await fireEvent.press(
    await screen.findByRole("link", { name: "New Playlist" }),
  );
  await fireEvent.changeText(
    screen.getByPlaceholderText("Enter playlist name"),
    name,
  );
  await fireEvent.press(screen.getByRole("button", { name: "Create" }));
  return router;
}

async function renameRoadTripTo(name: string) {
  const router = await renderLibraryTab();
  await screen.findByText("Road Trip");
  await chooseMenuAction("Options for Road Trip", "rename");
  await fireEvent.changeText(
    await screen.findByPlaceholderText("Enter playlist name"),
    name,
  );
  await fireEvent.press(screen.getByRole("button", { name: "Save" }));
  return router;
}

beforeEach(async () => {
  await act(async () => signInAs("alice"));
  procedure("user.getUserPlaylists").mockResolvedValue([
    playlistSummary(roadTrip),
  ]);
  procedure("user.getPlaylistDetails").mockImplementation(
    async ({ playlistId }) => (playlistId === roadTrip.id ? roadTrip : null),
  );
});

afterEach(() => {
  resetPlaylistOverlay();
  resetFavoriteOverlay();
  jest.restoreAllMocks();
});

describe("LibraryScreen", () => {
  it("asks a signed-out listener to sign in", async () => {
    await act(async () => signInAs(null));
    const router = await renderLibraryTab();

    await fireEvent.press(screen.getByRole("button", { name: "Sign in" }));

    expect(router.getPathname()).toBe("/login");
    expect(procedure("user.getUserPlaylists")).not.toHaveBeenCalled();
  });

  it("links to each saved list and lists the playlists", async () => {
    const router = await renderLibraryTab();

    expect(await screen.findByText("Road Trip")).toBeOnTheScreen();
    expect(screen.getByText("2 songs")).toBeOnTheScreen();
    for (const title of [
      "Liked Songs",
      "Recently Played",
      "Liked Albums",
      "Liked Artists",
      "Liked Playlists",
      "Liked Podcasts",
    ]) {
      expect(screen.getByText(title)).toBeOnTheScreen();
    }

    await fireEvent.press(screen.getByText("Liked Songs"));
    expect(router.getPathname()).toBe("/me/liked-songs");
  });

  it("titles Android's page itself", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    await renderLibraryTab();
    expect(
      await screen.findByRole("header", { name: "Library" }),
    ).toBeOnTheScreen();
    jest.restoreAllMocks();
  });

  it("counts the liked songs on their tile", async () => {
    procedure("user.getUserFavorites").mockResolvedValue(
      favoritesRow({ songs: ["a", "b", "c"] }),
    );
    await renderLibraryTab();

    expect(
      await screen.findByRole("link", { name: "Liked Songs, 3 songs" }),
    ).toBeOnTheScreen();
  });

  it("counts the recently played songs on their tile", async () => {
    procedure("history.list").mockResolvedValue([
      { id: "a", type: "song" },
      { id: "b", type: "song" },
    ]);
    procedure("song.items").mockImplementation(
      catalogAnswering({
        a: songNamed("a", "Alpha"),
        b: songNamed("b", "Beta"),
      }),
    );
    await renderLibraryTab();

    expect(
      await screen.findByRole("link", { name: "Recently Played, 2 songs" }),
    ).toBeOnTheScreen();
  });

  it("shows a playlist's first song as its cover, the icon until then", async () => {
    procedure("song.details").mockImplementation(
      catalogAnswering({ a: songNamed("a", "Alpha") }),
    );
    await renderLibraryTab();

    expect(await screen.findByTestId("list-row-art")).toBeOnTheScreen();
    expect(procedure("song.details")).toHaveBeenCalledTimes(1);
  });

  it("fades the playlists in over their skeleton", async () => {
    await renderLibraryTab();

    const reveal = await screen.findByTestId("playlists-reveal");
    expect(reveal.props.entering).toBe(CONTENT_REVEAL);
  });

  it("shows a skeleton while the playlists load", async () => {
    procedure("user.getUserPlaylists").mockReturnValue(new Promise(() => {}));
    await renderLibraryTab();

    expect(await screen.findByLabelText("Loading")).toBeOnTheScreen();
    expect(screen.getAllByTestId("media-skeleton-menu")).toHaveLength(3);
  });

  it("invites a listener without playlists to make one", async () => {
    procedure("user.getUserPlaylists").mockResolvedValue([]);
    await renderLibraryTab();

    expect(
      await screen.findByText(/Collect songs you love into playlists/),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole("link", { name: "New Playlist" }),
    ).toBeOnTheScreen();
  });

  it("shows an error with a retry when the playlists cannot load", async () => {
    procedure("user.getUserPlaylists").mockRejectedValueOnce(new Error("down"));
    await renderLibraryTab();

    await fireEvent.press(
      await screen.findByRole("button", { name: "Try again" }),
    );

    expect(await screen.findByText("Road Trip")).toBeOnTheScreen();
  });
});

describe("creating a playlist", () => {
  it("shows a pending row at once and the real playlist when it lands", async () => {
    const write = deferred<ReturnType<typeof userPlaylist>>();
    procedure("user.createNewPlaylist").mockReturnValue(write.promise);

    const router = await createPlaylistNamed("Weekend");

    expect(router.getPathname()).toBe("/");
    expect(screen.getByText("Weekend")).toBeOnTheScreen();
    expect(screen.getByText("Creating…")).toBeOnTheScreen();
    // A labelled view, never a disabled button (it has no screen yet).
    expect(screen.getByLabelText("Weekend, Creating…")).toBeOnTheScreen();
    expect(
      screen.queryByRole("link", { name: /^Weekend/ }),
    ).not.toBeOnTheScreen();
    expect(
      screen.queryByRole("button", { name: /^Weekend/ }),
    ).not.toBeOnTheScreen();

    await act(async () =>
      write.resolve(userPlaylist({ id: "pl-9", name: "Weekend" })),
    );

    expect(await screen.findByLabelText("Weekend, 0 songs")).toBeOnTheScreen();
    expect(screen.queryByText("Creating…")).toBeNull();
  });

  it("removes the pending row when the server refuses", async () => {
    procedure("user.createNewPlaylist").mockRejectedValue(
      Object.assign(
        new Error("You can only have 10 playlists, please delete one"),
        {
          data: { code: "BAD_REQUEST" },
        },
      ),
    );

    await createPlaylistNamed("Weekend");

    await screen.findByText("Road Trip");
    expect(screen.queryByText("Weekend")).toBeNull();
  });

  it("adds a menu's songs to the playlist it creates", async () => {
    procedure("user.createNewPlaylist").mockResolvedValue(
      userPlaylist({ id: "pl-9", name: "Weekend" }),
    );
    await renderLibraryTab();
    await screen.findByText("Road Trip");
    await act(async () =>
      appRouter.push({
        pathname: "/create-playlist",
        params: { songs: "x1,x2", label: "2 songs" },
      }),
    );

    await fireEvent.changeText(
      await screen.findByPlaceholderText("Enter playlist name"),
      "Weekend",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Create" }));

    await waitFor(() =>
      expect(procedure("user.addSongsToPlaylist")).toHaveBeenCalledWith({
        playlistId: "pl-9",
        songs: ["x1", "x2"],
      }),
    );
    expect(procedure("user.createNewPlaylist")).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Weekend" }),
    );
  });

  it("explains a name that is too short and writes nothing", async () => {
    const router = await createPlaylistNamed("ab");

    expect(
      screen.getByText("Name must be at least 3 characters long"),
    ).toBeOnTheScreen();
    expect(router.getPathname()).toBe("/create-playlist");
    expect(procedure("user.createNewPlaylist")).not.toHaveBeenCalled();
  });
});

describe("renaming a playlist", () => {
  it("changes the name in the library at once", async () => {
    const write = deferred<ReturnType<typeof userPlaylist>>();
    procedure("user.renamePlaylist").mockReturnValue(write.promise);

    const router = await renameRoadTripTo("Highway");

    expect(router.getPathname()).toBe("/");
    expect(screen.getByText("Highway")).toBeOnTheScreen();
    expect(procedure("user.renamePlaylist")).toHaveBeenCalledWith({
      playlistId: "pl-1",
      name: "Highway",
    });
  });

  it("puts the old name back when the write fails", async () => {
    procedure("user.renamePlaylist").mockRejectedValue(
      new Error("Could not rename"),
    );

    await renameRoadTripTo("Highway");

    expect(await screen.findByText("Road Trip")).toBeOnTheScreen();
    expect(screen.queryByText("Highway")).toBeNull();
  });
});

describe("deleting a playlist", () => {
  it("asks first, then hides the playlist at once", async () => {
    const alert = jest.spyOn(Alert, "alert");
    procedure("user.deletePlaylist").mockReturnValue(new Promise(() => {}));
    await renderLibraryTab();
    await screen.findByText("Road Trip");

    await chooseMenuAction("Options for Road Trip", "delete");
    expect(screen.getByText("Road Trip")).toBeOnTheScreen();
    expect(alert).toHaveBeenCalledWith(
      "Delete this playlist?",
      expect.stringContaining('"Road Trip"'),
      expect.any(Array),
    );

    await confirmDelete(alert);

    expect(screen.queryByText("Road Trip")).toBeNull();
    expect(procedure("user.deletePlaylist")).toHaveBeenCalledWith({
      playlistId: "pl-1",
    });
  });

  it("deletes from the swipe action too", async () => {
    const alert = jest.spyOn(Alert, "alert");
    await renderLibraryTab();
    await screen.findByText("Road Trip");

    await fireEvent.press(screen.getByRole("button", { name: "Delete" }));

    expect(alert).toHaveBeenCalledTimes(1);
  });

  it("brings the playlist back when the delete fails", async () => {
    const alert = jest.spyOn(Alert, "alert");
    procedure("user.deletePlaylist").mockRejectedValue(
      new Error("Could not delete"),
    );
    await renderLibraryTab();
    await screen.findByText("Road Trip");

    await chooseMenuAction("Options for Road Trip", "delete");
    await confirmDelete(alert);

    expect(await screen.findByText("Road Trip")).toBeOnTheScreen();
  });
});
