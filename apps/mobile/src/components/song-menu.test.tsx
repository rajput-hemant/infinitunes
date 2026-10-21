import { toSongRow } from "@infinitunes/types";
import { rawEpisode, rawSong } from "@infinitunes/types/fixtures";
import { act } from "@testing-library/react-native";
import { View } from "react-native";
import { toast } from "sonner-native";

import { downloadTrack } from "~/lib/download";
import { preferencesStore } from "~/lib/preferences";
import { shareItem } from "~/lib/share";
import { playerStore } from "~/playback/player-store";
import { chooseMenuAction, renderScreen } from "~/test/render";
import { signInAs } from "~/test/session-mock";

import { SongMenu, type TrackItem } from "./song-menu";

jest.mock("~/lib/download", () => ({ downloadTrack: jest.fn() }));
jest.mock("~/lib/share", () => ({ shareItem: jest.fn() }));

const song = toSongRow(rawSong());
const initialPlayer = playerStore.getState();
const initialPreferences = preferencesStore.getState();

beforeEach(() => {
  playerStore.setState(initialPlayer, true);
  preferencesStore.setState(initialPreferences, true);
  jest.clearAllMocks();
});

const TRIGGER = "Song actions";
const ARTIST_ROUTES = {
  "artist/[name]/[token]/index": () => null,
  "artist/[name]/[token]/[tab]": () => null,
};
const queuedIds = () => playerStore.getState().queue.map((entry) => entry.id);

function renderMenu(
  item: TrackItem,
  removal?: { title: string; onRemove: () => void },
  routes: Record<string, () => null> = {},
) {
  return renderScreen(
    <SongMenu song={item} removal={removal}>
      {/* The menu's trigger is whatever the row puts inside it. */}
      <Trigger />
    </SongMenu>,
    { routes },
  );
}

function Trigger() {
  return <View accessibilityLabel={TRIGGER} />;
}

describe("SongMenu queue actions", () => {
  it("plays the song next, right after the current one", async () => {
    playerStore.getState().playTracks([toSongRow(rawSong({ id: "now" }))]);
    await renderMenu(song);

    await chooseMenuAction(TRIGGER, "play-next");

    expect(queuedIds()).toEqual(["now", "BSaNI3Yr"]);
  });

  it("adds it to the end of the queue and says so", async () => {
    playerStore.getState().playTracks([toSongRow(rawSong({ id: "now" }))]);
    await renderMenu(song);

    await chooseMenuAction(TRIGGER, "add-to-queue");

    expect(queuedIds()).toEqual(["now", "BSaNI3Yr"]);
    expect(jest.mocked(toast)).toHaveBeenCalledWith(
      '"FA9LA & Friends" added to queue',
    );
  });
});

describe("SongMenu navigation", () => {
  it("opens the album the song is on", async () => {
    const app = await renderMenu(song, undefined, {
      "album/[name]/[token]": () => null,
    });

    await chooseMenuAction(TRIGGER, "go-to-album");

    expect(app.getPathname()).toMatch(/^\/album\/[^/]+\/[^/]+$/);
    expect(app.getPathname()).toContain(
      (song.albumUrl ?? "").split("/").slice(-2).join("/"),
    );
  });

  it("has no album entry when the song carries no album link", async () => {
    const app = await renderMenu({ ...song, albumUrl: undefined }, undefined, {
      "album/[name]/[token]": () => null,
    });

    await chooseMenuAction(TRIGGER, "go-to-album");

    expect(app.getPathname()).toBe("/");
  });

  it("goes straight to the only artist", async () => {
    const [artist] = song.primaryArtists;
    const app = await renderMenu(
      { ...song, primaryArtists: artist ? [artist] : [] },
      undefined,
      ARTIST_ROUTES,
    );

    await chooseMenuAction(TRIGGER, "go-to-artist");

    expect(app.getPathname()).toMatch(/^\/artist\//);
  });

  it("lists several artists and opens the one chosen", async () => {
    const [first] = song.primaryArtists;
    if (!first) throw new Error("The fixture has no primary artist");
    const second = {
      ...first,
      id: "9999",
      name: "Second Artist",
      perma_url: "https://www.jiosaavn.com/artist/second-artist/Tok2_",
    };
    const app = await renderMenu(
      { ...song, primaryArtists: [first, second] },
      undefined,
      ARTIST_ROUTES,
    );

    // The group itself does nothing; its entries do.
    await chooseMenuAction(TRIGGER, "go-to-artist");
    expect(app.getPathname()).toBe("/");

    await chooseMenuAction(TRIGGER, "artist:9999");
    expect(app.getPathname()).toBe("/artist/second-artist/Tok2_");
  });

  it("falls back to the credits when a row has no primary artists", async () => {
    const [credit] = song.artists;
    const app = await renderMenu(
      { ...song, primaryArtists: undefined, artists: credit ? [credit] : [] },
      undefined,
      ARTIST_ROUTES,
    );

    await chooseMenuAction(TRIGGER, "go-to-artist");

    expect(app.getPathname()).toMatch(/^\/artist\//);
  });

  it("has no artist entry for an uncredited song", async () => {
    const app = await renderMenu(
      { ...song, primaryArtists: [], artists: [] },
      undefined,
      ARTIST_ROUTES,
    );

    await chooseMenuAction(TRIGGER, "go-to-artist");

    expect(app.getPathname()).toBe("/");
  });
});

describe("SongMenu share and download", () => {
  it("shares the song's web page", async () => {
    await renderMenu(song);

    await chooseMenuAction(TRIGGER, "share");

    expect(shareItem).toHaveBeenCalledWith(song);
  });

  it("downloads at the download quality preference, with a progress toast", async () => {
    preferencesStore.getState().setDownloadQuality("low");
    jest.mocked(downloadTrack).mockResolvedValue(undefined);
    await renderMenu(song);

    await chooseMenuAction(TRIGGER, "download");

    expect(downloadTrack).toHaveBeenCalledWith(song, "low");
    const [, messages] = jest.mocked(toast.promise).mock.calls[0] ?? [];
    expect(messages).toMatchObject({
      loading: 'Downloading "FA9LA & Friends"...',
    });
    const { success, error } = messages ?? {};
    expect(typeof success === "function" && success(undefined)).toBe(
      '"FA9LA & Friends" is ready',
    );
    expect(typeof error === "function" && error(new Error("No link"))).toBe(
      "No link",
    );
    expect(typeof error === "function" && error("odd")).toBe("Download failed");
  });
});

describe("SongMenu removal", () => {
  it("adds the list's own destructive action, and runs it", async () => {
    const onRemove = jest.fn();
    await renderMenu(song, { title: "Remove from Queue", onRemove });

    await chooseMenuAction(TRIGGER, "remove");

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("has no removal when the list offers none", async () => {
    await renderMenu(song);

    await chooseMenuAction(TRIGGER, "remove");

    expect(queuedIds()).toEqual([]);
  });
});

describe("SongMenu for an episode", () => {
  const episode = toSongRow(rawEpisode("9001"));

  it("queues it like a song", async () => {
    await renderMenu(episode);

    await chooseMenuAction(TRIGGER, "add-to-queue");

    expect(queuedIds()).toEqual(["9001"]);
  });

  it("offers no playlist, radio, album or download", async () => {
    await act(async () => signInAs("alice"));
    await renderMenu(episode);

    await chooseMenuAction(TRIGGER, "add-to-playlist");
    await chooseMenuAction(TRIGGER, "play-radio");
    await chooseMenuAction(TRIGGER, "download");

    expect(downloadTrack).not.toHaveBeenCalled();
    expect(jest.mocked(toast.warning)).not.toHaveBeenCalled();
  });
});
