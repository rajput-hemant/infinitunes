import { resetFavoriteOverlay } from "@infinitunes/core/react/optimistic-favorite";
import { resetPlaylistOverlay } from "@infinitunes/core/react/optimistic-playlists";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { Alert } from "react-native";
import type { AlertButton } from "react-native";
import { toast } from "sonner-native";

import { signInAs } from "~/test/session-mock";

import { EditPlaylistScreen } from "./edit-playlist-screen";
import { LibraryScreen } from "./library-screen";
import { deferred, trpcClient, userPlaylist } from "./library-test-support";
import { NewPlaylistScreen } from "./new-playlist-screen";
import { chooseMenuAction, renderLibrary } from "./render-library";

jest.mock("~/lib/trpc", () => require("./library-test-support"));
jest.mock("~/lib/auth-client", () => require("~/test/session-mock"));
jest.mock(
  "react-native-gesture-handler/ReanimatedSwipeable",
  () => require("./library-ui-mocks").swipeable,
);
jest.mock(
  "~/components/ui/skeleton",
  () => require("./library-ui-mocks").skeleton,
);

const roadTrip = userPlaylist({
  id: "pl-1",
  name: "Road Trip",
  songs: ["a", "b"],
});

function renderLibraryTab() {
  return renderLibrary({
    index: LibraryScreen,
    login: () => null,
    "me/new-playlist": NewPlaylistScreen,
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
  await fireEvent.press(await screen.findByText("New Playlist"));
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
  trpcClient.user.getUserPlaylists.query.mockResolvedValue([roadTrip]);
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
    expect(trpcClient.user.getUserPlaylists.query).not.toHaveBeenCalled();
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

  it("shows a skeleton while the playlists load", async () => {
    trpcClient.user.getUserPlaylists.query.mockReturnValue(
      new Promise(() => {}),
    );
    await renderLibraryTab();

    expect(await screen.findByLabelText("Loading")).toBeOnTheScreen();
  });

  it("invites a listener without playlists to make one", async () => {
    trpcClient.user.getUserPlaylists.query.mockResolvedValue([]);
    await renderLibraryTab();

    expect(
      await screen.findByText(/Collect songs you love into playlists/),
    ).toBeOnTheScreen();
    expect(screen.getByText("New Playlist")).toBeOnTheScreen();
  });

  it("shows an error with a retry when the playlists cannot load", async () => {
    trpcClient.user.getUserPlaylists.query.mockRejectedValueOnce(
      new Error("down"),
    );
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
    trpcClient.user.createNewPlaylist.mutate.mockReturnValue(write.promise);

    const router = await createPlaylistNamed("Weekend");

    expect(router.getPathname()).toBe("/");
    expect(screen.getByText("Weekend")).toBeOnTheScreen();
    expect(screen.getByText("Creating…")).toBeOnTheScreen();
    expect(
      screen.getByRole("text", { name: "Weekend, Creating…" }),
    ).toBeDisabled();

    await act(async () =>
      write.resolve(userPlaylist({ id: "pl-9", name: "Weekend" })),
    );

    expect(await screen.findByText("0 songs")).toBeOnTheScreen();
    expect(screen.queryByText("Creating…")).toBeNull();
    expect(toast.success).toHaveBeenCalledWith('Playlist "Weekend" created');
  });

  it("removes the pending row and says why when the server refuses", async () => {
    trpcClient.user.createNewPlaylist.mutate.mockRejectedValue(
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
    expect(toast.error).toHaveBeenCalledWith(
      "You can only have 10 playlists, please delete one",
    );
  });

  it("explains a name that is too short and writes nothing", async () => {
    const router = await createPlaylistNamed("ab");

    expect(
      screen.getByText("Name must be at least 3 characters long"),
    ).toBeOnTheScreen();
    expect(router.getPathname()).toBe("/me/new-playlist");
    expect(trpcClient.user.createNewPlaylist.mutate).not.toHaveBeenCalled();
  });
});

describe("renaming a playlist", () => {
  it("changes the name in the library at once", async () => {
    const write = deferred<undefined>();
    trpcClient.user.renamePlaylist.mutate.mockReturnValue(write.promise);

    const router = await renameRoadTripTo("Highway");

    expect(router.getPathname()).toBe("/");
    expect(screen.getByText("Highway")).toBeOnTheScreen();
    expect(trpcClient.user.renamePlaylist.mutate).toHaveBeenCalledWith({
      playlistId: "pl-1",
      name: "Highway",
    });
  });

  it("puts the old name back with a toast when the write fails", async () => {
    trpcClient.user.renamePlaylist.mutate.mockRejectedValue(
      new Error("Could not rename"),
    );

    await renameRoadTripTo("Highway");

    expect(await screen.findByText("Road Trip")).toBeOnTheScreen();
    expect(screen.queryByText("Highway")).toBeNull();
    expect(toast.error).toHaveBeenCalledWith("Could not rename");
  });
});

describe("deleting a playlist", () => {
  it("asks first, then hides the playlist at once", async () => {
    const alert = jest.spyOn(Alert, "alert");
    trpcClient.user.deletePlaylist.mutate.mockReturnValue(
      new Promise(() => {}),
    );
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
    expect(trpcClient.user.deletePlaylist.mutate).toHaveBeenCalledWith({
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

  it("brings the playlist back with a toast when the delete fails", async () => {
    const alert = jest.spyOn(Alert, "alert");
    trpcClient.user.deletePlaylist.mutate.mockRejectedValue(
      new Error("Could not delete"),
    );
    await renderLibraryTab();
    await screen.findByText("Road Trip");

    await chooseMenuAction("Options for Road Trip", "delete");
    await confirmDelete(alert);

    expect(await screen.findByText("Road Trip")).toBeOnTheScreen();
    expect(toast.error).toHaveBeenCalledWith("Could not delete");
  });
});
