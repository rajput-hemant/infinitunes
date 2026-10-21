import { resetPlaylistOverlay } from "@infinitunes/core/react/optimistic-playlists";
import { toSongRow } from "@infinitunes/types";
import { rawEpisode, rawSong } from "@infinitunes/types/fixtures";
import { act, waitFor } from "@testing-library/react-native";
import { Directory } from "expo-file-system";
import {
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
} from "expo-notifications";
import { AppState } from "react-native";
import { toast } from "sonner-native";

import { pickDownloadFolder, saveTracks } from "~/lib/download";
import { notificationPromptStore } from "~/lib/notifications";
import { preferencesStore } from "~/lib/preferences";
import { chooseMenuAction, renderWithProviders } from "~/test/render";
import { signInAs } from "~/test/session-mock";
import { procedure } from "~/test/trpc-mock";
import { userPlaylist } from "~/test/user-library";

import { CollectionMenu } from "./collection-menu";

jest.mock("~/lib/download", () => ({
  pickDownloadFolder: jest.fn(),
  saveTracks: jest.fn(),
}));
jest.mock("expo-file-system", () => ({ Directory: jest.fn() }));

const rows = ["one", "two", "three"].map((id) =>
  toSongRow(rawSong({ id, title: `Song ${id}` })),
);
const trigger = "More actions for Udta Teer";
const menu = (songs = rows) => <CollectionMenu name="Udta Teer" rows={songs} />;

const initialPreferences = preferencesStore.getState();
beforeEach(() => preferencesStore.setState(initialPreferences, true));

describe("add to playlist", () => {
  // Each optimistic record expires on a long timer; a real one would keep
  // the Jest worker alive after the suite.
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    resetPlaylistOverlay();
  });

  it("asks a signed-out listener to sign in instead", async () => {
    await renderWithProviders(menu());

    await chooseMenuAction(trigger, "add-to-playlist");

    expect(jest.mocked(toast.warning)).toHaveBeenCalledWith(
      "Sign in to continue",
      expect.objectContaining({
        description: "You need an account to make playlists.",
      }),
    );
    expect(procedure("user.addSongsToPlaylist")).not.toHaveBeenCalled();
  });

  it("adds every song to the chosen playlist", async () => {
    await act(async () => signInAs("alice"));
    procedure("user.getUserPlaylists").mockResolvedValue([
      userPlaylist({ id: "pl-1", name: "Road Trip" }),
    ]);
    await renderWithProviders(menu());

    // The playlists load behind the menu (the query cache notifies readers
    // on a timer); its entry exists once they have.
    await act(async () => {
      await jest.advanceTimersByTimeAsync(10);
    });

    await chooseMenuAction(trigger, "playlist:pl-1");

    expect(procedure("user.addSongsToPlaylist")).toHaveBeenCalledWith({
      playlistId: "pl-1",
      songs: ["one", "two", "three"],
    });
  });

  it("offers only queue actions for episodes", async () => {
    await act(async () => signInAs("alice"));
    const episodes = [toSongRow(rawEpisode("9001"))];
    await renderWithProviders(menu(episodes));

    await chooseMenuAction(trigger, "play-radio");
    await chooseMenuAction(trigger, "download-all");

    expect(procedure("radio.createStation")).not.toHaveBeenCalled();
    expect(pickDownloadFolder).not.toHaveBeenCalled();
  });
});

describe("download all", () => {
  beforeEach(() => jest.clearAllMocks());

  it("does nothing when the listener dismisses the folder picker", async () => {
    jest.mocked(pickDownloadFolder).mockResolvedValue(null);
    await renderWithProviders(menu());

    await chooseMenuAction(trigger, "download-all");
    await act(async () => {});

    expect(saveTracks).not.toHaveBeenCalled();
    expect(toast.promise).not.toHaveBeenCalled();
  });

  it("saves the songs into the folder at the download quality preference", async () => {
    const folder = new Directory();
    jest.mocked(pickDownloadFolder).mockResolvedValue(folder);
    jest.mocked(saveTracks).mockResolvedValue({ saved: 3, failed: 0 });
    preferencesStore.getState().setDownloadQuality("low");
    await renderWithProviders(menu());

    await chooseMenuAction(trigger, "download-all");
    await waitFor(() => expect(toast.promise).toHaveBeenCalledTimes(1));

    expect(saveTracks).toHaveBeenCalledWith(folder, rows, "low");
    const [, messages] = jest.mocked(toast.promise).mock.calls[0] ?? [];
    expect(messages).toMatchObject({
      loading: "Downloading 3 songs...",
      error: "Download failed",
    });
  });

  it("asks for notifications once and posts the result when it finishes", async () => {
    notificationPromptStore.setState({ asked: false });
    jest
      .mocked(getPermissionsAsync)
      .mockResolvedValue({ granted: false, canAskAgain: true } as never);
    jest.mocked(pickDownloadFolder).mockResolvedValue(new Directory());
    jest.mocked(saveTracks).mockResolvedValue({ saved: 3, failed: 0 });
    Object.assign(AppState, { currentState: "background" });
    await renderWithProviders(menu());

    await chooseMenuAction(trigger, "download-all");
    await waitFor(() => expect(toast.promise).toHaveBeenCalledTimes(1));

    expect(requestPermissionsAsync).toHaveBeenCalledTimes(1);
    // Denied: the result is not posted.
    await waitFor(() => expect(getPermissionsAsync).toHaveBeenCalled());
    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
    jest
      .mocked(getPermissionsAsync)
      .mockResolvedValue({ granted: true, canAskAgain: true } as never);
  });

  it("posts the failure and fails the toast when saving rejects outright", async () => {
    jest
      .mocked(getPermissionsAsync)
      .mockResolvedValue({ granted: true, canAskAgain: true } as never);
    jest.mocked(pickDownloadFolder).mockResolvedValue(new Directory());
    jest
      .mocked(saveTracks)
      .mockRejectedValue(new Error("The folder is no longer available"));
    Object.assign(AppState, { currentState: "background" });
    await renderWithProviders(menu());

    await chooseMenuAction(trigger, "download-all");
    await waitFor(() => expect(toast.promise).toHaveBeenCalledTimes(1));

    const [job] = jest.mocked(toast.promise).mock.calls[0] ?? [];
    await expect(job).rejects.toThrow("The folder is no longer available");
    await waitFor(() =>
      expect(scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: "Download failed",
            body: "No songs could be saved.",
          }),
        }),
      ),
    );
  });

  it("reports how many saved when some failed, and says 'song' for one", async () => {
    jest.mocked(pickDownloadFolder).mockResolvedValue(new Directory());
    jest.mocked(saveTracks).mockResolvedValue({ saved: 2, failed: 1 });
    await renderWithProviders(menu());

    await chooseMenuAction(trigger, "download-all");
    await waitFor(() => expect(toast.promise).toHaveBeenCalledTimes(1));

    const [, messages] = jest.mocked(toast.promise).mock.calls[0] ?? [];
    const success = messages?.success;
    expect(typeof success).toBe("function");
    if (typeof success !== "function") return;
    expect(success({ saved: 2, failed: 1 })).toBe("Downloaded 2 of 3 songs");
    expect(success({ saved: 3, failed: 0 })).toBe("Downloaded 3 songs");
  });

  it("says 'song' for a single download", async () => {
    jest.mocked(pickDownloadFolder).mockResolvedValue(new Directory());
    jest.mocked(saveTracks).mockResolvedValue({ saved: 1, failed: 0 });
    await renderWithProviders(menu(rows.slice(0, 1)));

    await chooseMenuAction(trigger, "download-all");
    await waitFor(() => expect(toast.promise).toHaveBeenCalledTimes(1));

    expect(jest.mocked(toast.promise).mock.calls[0]?.[1]).toMatchObject({
      loading: "Downloading 1 song...",
    });
  });
});
