import type { Song, SongModules, SongObj } from "@infinitunes/types";
import { rawAlbum, rawLyrics, rawSong } from "@infinitunes/types/fixtures";
import { fireEvent, screen } from "@testing-library/react-native";

import { playerStore } from "~/playback/player-store";
import { renderScreen } from "~/test/render";
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
  procedure("get.lyrics").mockResolvedValue(rawLyrics());
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

    expect(screen.getAllByRole("progressbar")).toHaveLength(3);
    expect(screen.queryByText("Play")).toBeNull();
  });

  it("shows the header, credits and the album's other songs", async () => {
    await renderScreen(<SongScreen token="song-token" />);

    expect(await screen.findByText("FA9LA & Friends")).toBeOnTheScreen();
    expect(screen.getByText("FA9LA · Flipperachi")).toBeOnTheScreen();
    expect(
      screen.getByRole("link", { name: "Album, FA9LA" }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole("link", { name: "singer, Flipperachi" }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole("link", { name: "Label, Outlaw Productions" }),
    ).toBeOnTheScreen();
    expect(screen.getByText("(P) 2024 Outlaw Productions")).toBeOnTheScreen();
    expect(screen.getByText("01:45")).toBeOnTheScreen();
    expect(await screen.findByText("Album Neighbour")).toBeOnTheScreen();
    expect(
      screen.getByRole("header", { name: "More from FA9LA" }),
    ).toBeOnTheScreen();
    expect(await screen.findByText("Recommended One")).toBeOnTheScreen();
    expect(
      screen.getByRole("header", { name: "You might like" }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole("button", { name: "Like FA9LA & Friends" }),
    ).toBeOnTheScreen();
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

  it("collapses lyrics to the snippet and expands them as plain text", async () => {
    await renderScreen(<SongScreen token="song-token" />);

    expect(await screen.findByText("First line Second")).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole("button", { name: "Read full lyrics" }),
    );

    expect(
      screen.getByText("First line\nSecond & third\nbold"),
    ).toBeOnTheScreen();
    expect(screen.getByText("Lyrics powered by Musixmatch")).toBeOnTheScreen();
    expect(procedure("get.lyrics")).toHaveBeenCalledWith({ id: SONG_ID });
  });

  it("only looks up lyrics for songs that have them", async () => {
    procedure("song.details").mockResolvedValue(
      details({ songs: [song({ has_lyrics: "false" })] }),
    );
    await renderScreen(<SongScreen token="song-token" />);
    await screen.findByText("FA9LA & Friends");

    expect(procedure("get.lyrics")).not.toHaveBeenCalled();
    expect(screen.queryByRole("header", { name: "Lyrics" })).toBeNull();
  });

  it("leaves out the lyrics section when upstream has none", async () => {
    procedure("get.lyrics").mockResolvedValue(null);
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

    expect(
      await screen.findByText("Couldn't find this song"),
    ).toBeOnTheScreen();
  });

  it("shows not found when the token is an episode", async () => {
    const episode = Object.assign(song(), { type: "episode" });
    procedure("song.details").mockResolvedValue(details({ songs: [episode] }));
    await renderScreen(<SongScreen token="episode-token" />);

    expect(
      await screen.findByText("Couldn't find this song"),
    ).toBeOnTheScreen();
  });

  it("shows not found for a token upstream rejects", async () => {
    procedure("song.details").mockRejectedValue(trpcError("NOT_FOUND"));
    await renderScreen(<SongScreen token="nope" />);

    expect(
      await screen.findByText("Couldn't find this song"),
    ).toBeOnTheScreen();
  });

  it("offers a retry when the song fails to load", async () => {
    procedure("song.details").mockRejectedValueOnce(new Error("boom"));
    await renderScreen(<SongScreen token="song-token" />);

    expect(await screen.findByText("Couldn't load this")).toBeOnTheScreen();
    await fireEvent.press(screen.getByText("Try again"));

    expect(await screen.findByText("FA9LA & Friends")).toBeOnTheScreen();
  });
});
