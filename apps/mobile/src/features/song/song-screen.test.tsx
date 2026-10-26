import { plainText } from "@infinitunes/types";
import type { Song, SongModules, SongObj } from "@infinitunes/types";
import { rawAlbum, rawLyrics, rawSong } from "@infinitunes/types/fixtures";
import { fireEvent, screen } from "@testing-library/react-native";

import { CONTENT_REVEAL } from "~/components/skeletons";
import { playerStore } from "~/playback/player-store";
import { chooseMenuAction, renderScreen } from "~/test/render";
import { procedure, trpcError } from "~/test/trpc-mock";

import { SongScreen } from "./song-screen";

const SONG_ID = "BSaNI3Yr";

function song(moreInfo: Partial<Song["more_info"]> = {}): Song {
  const base = rawSong({ id: SONG_ID });
  return {
    ...base,
    more_info: { ...base.more_info, has_lyrics: "true", ...moreInfo },
  };
}

const section = (title: string) => ({
  title,
  subtitle: "",
  source: "",
  position: 1,
});

function modules(overrides: Partial<SongModules> = {}): SongModules {
  return {
    reco: {
      ...section("You might like"),
      source_params: { pid: SONG_ID, language: "hindi" },
    },
    currentlyTrending: {
      ...section("Trending Songs"),
      source_params: { entity_type: "song", entity_language: "hindi" },
    },
    songsBysameArtists: {
      ...section("More by Flipperachi"),
      source_params: {
        artist_ids: "2393548",
        song_id: SONG_ID,
        language: "hindi",
      },
    },
    songsBysameActors: {
      ...section("Same actors"),
      source_params: { actor_ids: "9", song_id: SONG_ID, language: "hindi" },
    },
    artists: section("Artists"),
    ...overrides,
  };
}

function details(data: Partial<SongObj> = {}): SongObj {
  return { songs: [song()], modules: modules(), ...data };
}

const initial = playerStore.getState();

beforeEach(() => {
  playerStore.setState(initial, true);
  procedure("song.details").mockResolvedValue(details());
  procedure("song.recommendations").mockResolvedValue([
    rawSong({ id: "reco-1", title: "Recommended One" }),
  ]);
  procedure("get.trending").mockResolvedValue([]);
  procedure("artist.topSongs").mockResolvedValue([]);
  procedure("get.actorTopSongs").mockResolvedValue([]);
  procedure("song.syncedLyrics").mockResolvedValue({
    synced: null,
    plain: plainText(rawLyrics().lyrics),
    copyright: plainText(rawLyrics().lyrics_copyright),
    instrumental: false,
    source: "jiosaavn",
  });
  procedure("album.details").mockResolvedValue(
    rawAlbum({
      list: [song(), rawSong({ id: "album-2", title: "Album Neighbour" })],
    }),
  );
});

describe("SongScreen", () => {
  it("shows the skeleton while the song loads", async () => {
    procedure("song.details").mockReturnValue(new Promise(() => {}));
    await renderScreen(<SongScreen token="song-token" />);

    // The header and the lyrics lines, as the loaded page opens.
    expect(screen.getAllByRole("progressbar")).toHaveLength(2);
    expect(screen.queryByText("Play")).toBeNull();
  });

  it("shows the header and the album's other songs", async () => {
    await renderScreen(<SongScreen token="song-token" />);

    expect(await screen.findByText("FA9LA & Friends")).toBeOnTheScreen();
    expect(screen.getByText(/^Song · \d{4}$/)).toBeOnTheScreen();
    expect(screen.getAllByText("Flipperachi").length).toBeGreaterThan(0);
    // Credits live on their own screen, not inline.
    expect(screen.queryByRole("header", { name: "Credits" })).toBeNull();
    expect(screen.queryByText("(P) 2024 Outlaw Productions")).toBeNull();
    expect(await screen.findByText("Album Neighbour")).toBeOnTheScreen();
    expect(
      screen.getByRole("header", { name: "More from FA9LA" }),
    ).toBeOnTheScreen();
    expect(await screen.findByText("Recommended One")).toBeOnTheScreen();
    expect(
      screen.getByRole("header", { name: "You might like" }),
    ).toBeOnTheScreen();
    // Signed out: likes need an account, so there is no heart.
    expect(
      screen.queryByRole("button", { name: "Like FA9LA & Friends" }),
    ).toBeNull();
  });

  it("queues the song from the header's menu", async () => {
    await renderScreen(<SongScreen token="song-token" />);
    await screen.findByText("FA9LA & Friends");

    await chooseMenuAction("More actions for FA9LA & Friends", "add-to-queue");

    expect(playerStore.getState().queue.map((entry) => entry.id)).toEqual([
      "BSaNI3Yr",
    ]);
  });

  it("opens the credits screen from its menu", async () => {
    const app = await renderScreen(<SongScreen token="song-token" />, {
      routes: { "song/[name]/[token]/credits": () => null },
    });
    await screen.findByText("FA9LA & Friends");

    await chooseMenuAction("More actions for FA9LA & Friends", "credits");

    expect(app.getPathname()).toBe("/song/fa9la/BSaNI3Yr-token/credits");
  });

  it("plays just this song", async () => {
    await renderScreen(<SongScreen token="song-token" />);
    await screen.findByText("FA9LA & Friends");

    await fireEvent.press(screen.getByRole("button", { name: "Play" }));

    expect(playerStore.getState().queue.map((entry) => entry.id)).toEqual([
      SONG_ID,
    ]);
  });

  it("plays the rest of the album from a pressed row, not the song itself", async () => {
    await renderScreen(<SongScreen token="song-token" />);
    await screen.findByText("Album Neighbour");

    await fireEvent.press(
      screen.getByRole("button", { name: "Album Neighbour" }),
    );

    expect(playerStore.getState().queue.map((entry) => entry.id)).toEqual([
      "album-2",
    ]);
  });

  it("collapses lyrics to three lines and expands them as plain text", async () => {
    await renderScreen(<SongScreen token="song-token" />);

    expect(
      await screen.findByText("First line\nSecond & third\nbold"),
    ).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole("button", { name: "First line. Read full lyrics" }),
    );

    expect(
      screen.getByText("First line\nSecond & third\nbold"),
    ).toBeOnTheScreen();
    expect(screen.getByText("Lyrics powered by Musixmatch")).toBeOnTheScreen();
    expect(procedure("song.syncedLyrics")).toHaveBeenCalledWith({
      id: SONG_ID,
    });
  });

  it("fades the lyrics in over their skeleton and fades the full text in", async () => {
    await renderScreen(<SongScreen token="song-token" />);

    const reveal = await screen.findByTestId("lyrics-reveal");
    expect(reveal.props.entering).toBe(CONTENT_REVEAL);
    await fireEvent.press(
      screen.getByRole("button", { name: "First line. Read full lyrics" }),
    );
    expect(screen.getByTestId("lyrics-body").props.entering).toBe(
      CONTENT_REVEAL,
    );
  });

  it("looks up LRCLIB even when JioSaavn has no lyrics", async () => {
    procedure("song.details").mockResolvedValue(
      details({ songs: [song({ has_lyrics: "false" })] }),
    );
    await renderScreen(<SongScreen token="song-token" />);
    await screen.findByText("FA9LA & Friends");

    expect(procedure("song.syncedLyrics")).toHaveBeenCalledWith({
      id: SONG_ID,
    });
    expect(
      await screen.findByRole("header", { name: "Lyrics" }),
    ).toBeOnTheScreen();
  });

  it("leaves out the lyrics section when upstream has none", async () => {
    procedure("song.syncedLyrics").mockResolvedValue({
      synced: null,
      plain: null,
      copyright: null,
      instrumental: false,
      source: "jiosaavn",
    });
    await renderScreen(<SongScreen token="song-token" />);
    await screen.findByText("FA9LA & Friends");

    await screen.findByText("Recommended One");
    expect(screen.queryByRole("header", { name: "Lyrics" })).toBeNull();
  });

  it("shows songs from the same artists, and same actors only for a starring artist", async () => {
    procedure("artist.topSongs").mockResolvedValue([
      rawSong({ id: "same-artist", title: "Same Artist Song" }),
    ]);
    await renderScreen(<SongScreen token="song-token" />);

    expect(await screen.findByText("Same Artist Song")).toBeOnTheScreen();
    expect(procedure("artist.topSongs")).toHaveBeenCalledWith({
      artist_id: "2393548",
      song_id: SONG_ID,
      lang: "hindi",
    });
    expect(procedure("get.actorTopSongs")).not.toHaveBeenCalled();
  });

  it("asks for the same actors' songs when an artist is starring", async () => {
    const base = song();
    const [first] = base.more_info.artistMap.artists ?? [];
    procedure("song.details").mockResolvedValue(
      details({
        songs: [
          song({
            artistMap: {
              ...base.more_info.artistMap,
              artists: first ? [{ ...first, role: "starring" }] : [],
            },
          }),
        ],
      }),
    );
    procedure("get.actorTopSongs").mockResolvedValue([
      rawSong({ id: "actor-song", title: "Actor Song" }),
    ]);
    await renderScreen(<SongScreen token="song-token" />);

    expect(await screen.findByText("Actor Song")).toBeOnTheScreen();
    expect(procedure("get.actorTopSongs")).toHaveBeenCalledWith({
      actor_id: "9",
      song_id: SONG_ID,
      lang: "hindi",
    });
  });

  it("keeps the page when the album lookup fails", async () => {
    procedure("album.details").mockRejectedValue(new Error("upstream"));
    await renderScreen(<SongScreen token="song-token" />);

    expect(await screen.findByText("FA9LA & Friends")).toBeOnTheScreen();
    expect(await screen.findByText("Recommended One")).toBeOnTheScreen();
    expect(
      screen.queryByRole("header", { name: "More from FA9LA" }),
    ).toBeNull();
  });

  it("shows not found when upstream answers no songs", async () => {
    procedure("song.details").mockResolvedValue(details({ songs: [] }));
    await renderScreen(<SongScreen token="nope" />);

    expect(await screen.findByText("Song not found")).toBeOnTheScreen();
  });

  it("shows not found when the token is an episode", async () => {
    const episode = Object.assign(song(), { type: "episode" });
    procedure("song.details").mockResolvedValue(details({ songs: [episode] }));
    await renderScreen(<SongScreen token="episode-token" />);

    expect(await screen.findByText("Song not found")).toBeOnTheScreen();
  });

  it("shows not found for a token upstream rejects", async () => {
    procedure("song.details").mockRejectedValue(trpcError("NOT_FOUND"));
    await renderScreen(<SongScreen token="nope" />);

    expect(await screen.findByText("Song not found")).toBeOnTheScreen();
  });

  it("offers a retry when the song fails to load", async () => {
    procedure("song.details").mockRejectedValueOnce(new Error("boom"));
    await renderScreen(<SongScreen token="song-token" />);

    expect(await screen.findByText("Couldn't load this")).toBeOnTheScreen();
    await fireEvent.press(screen.getByText("Try again"));

    expect(await screen.findByText("FA9LA & Friends")).toBeOnTheScreen();
  });
});
