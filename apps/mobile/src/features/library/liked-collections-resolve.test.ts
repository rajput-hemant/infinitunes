import {
  rawAlbum,
  rawArtist,
  rawEpisode,
  rawPlaylist,
  rawShow,
  SHOW_TOKEN,
} from "@infinitunes/types/fixtures";

import { procedure } from "~/test/trpc-mock";

import { LIKED_COLLECTIONS } from "./liked-collections";

describe("LIKED_COLLECTIONS resolve", () => {
  it("turns a liked album id into its card", async () => {
    const details = procedure("album.details");
    details.mockResolvedValue(rawAlbum({ id: "1", title: "Udta &amp; Teer" }));

    const card = await LIKED_COLLECTIONS.albums.resolve("1");

    expect(details).toHaveBeenCalledWith({ id: "1" });
    expect(card).toMatchObject({ id: "1", type: "album", name: "Udta & Teer" });
  });

  it("turns a liked playlist id into its card", async () => {
    const details = procedure("playlist.details");
    details.mockResolvedValue(rawPlaylist());

    const card = await LIKED_COLLECTIONS.playlists.resolve("pl-1");

    expect(details).toHaveBeenCalledWith({ id: "pl-1" });
    expect(card?.type).toBe("playlist");
  });

  it("opens a liked artist on the songs URL of its details", async () => {
    const artist = rawArtist();
    procedure("artist.details").mockResolvedValue(artist);

    const card = await LIKED_COLLECTIONS.artists.resolve(artist.artistId);

    expect(card).toMatchObject({
      id: artist.artistId,
      type: "artist",
      url: artist.urls.songs,
    });
  });

  it("lets a failed lookup reject, so the screen can count it as unloaded", async () => {
    procedure("album.details").mockRejectedValue(new Error("gone"));

    await expect(LIKED_COLLECTIONS.albums.resolve("9")).rejects.toThrow("gone");
  });

  describe("a liked podcast", () => {
    it("is a show id, found through its episodes' show URL", async () => {
      const episodes = procedure("show.episodes");
      episodes.mockResolvedValue([rawEpisode("9001")]);
      const details = procedure("show.details");
      details.mockResolvedValue(rawShow());

      const card = await LIKED_COLLECTIONS.shows.resolve("5555");

      expect(episodes).toHaveBeenCalledWith({ id: "5555" });
      expect(details).toHaveBeenCalledWith({ token: SHOW_TOKEN });
      expect(card).toMatchObject({
        type: "show",
        name: "The Ranveer Show & Friends",
      });
    });

    it("is unresolvable, without a details request, when the show has no episodes", async () => {
      procedure("show.episodes").mockResolvedValue([]);

      await expect(
        LIKED_COLLECTIONS.shows.resolve("5555"),
      ).resolves.toBeUndefined();

      expect(procedure("show.details")).not.toHaveBeenCalled();
    });

    it("is unresolvable when the first episode carries no show URL", async () => {
      const episode = rawEpisode("9001");
      procedure("show.episodes").mockResolvedValue([
        { ...episode, more_info: { ...episode.more_info, show_url: "" } },
      ]);

      await expect(
        LIKED_COLLECTIONS.shows.resolve("5555"),
      ).resolves.toBeUndefined();

      expect(procedure("show.details")).not.toHaveBeenCalled();
    });
  });
});

describe("LIKED_COLLECTIONS columns", () => {
  it("reads each kind from its own favorites list, shows from the podcasts column", () => {
    expect(
      Object.fromEntries(
        Object.entries(LIKED_COLLECTIONS).map(([kind, c]) => [kind, c.column]),
      ),
    ).toEqual({
      albums: "albums",
      artists: "artists",
      playlists: "playlists",
      shows: "podcasts",
    });
  });
});
