import type { AllSearch, TopSearch } from "../search";

/**
 * Raw `search.all` and `search.top` payloads for tests, shaped like the live
 * upstream: HTML-encoded titles, artists and the top query without a
 * `perma_url`, groups ordered by `position`, an untyped empty `episodes`.
 */

const artworkPath = "https://c.saavncdn.com";

export const rawTopSearches: TopSearch[] = [
  {
    id: "LHgqn,SRpyA_",
    title: "Rock &amp; Roll",
    subtitle: "Sachin-Jigar",
    type: "album",
    image: `${artworkPath}/845/Rock-Roll-150x150.jpg`,
    perma_url: "https://www.jiosaavn.com/album/rock-roll/LHgqn,SRpyA_",
    explicit_content: "0",
    more_info: {},
  },
  {
    id: "BSaNI3Yr",
    title: "FA9LA",
    subtitle: "Flipperachi",
    type: "song",
    image: `${artworkPath}/fa9la-150x150.jpg`,
    perma_url: "https://www.jiosaavn.com/song/fa9la/BSaNI3Yr",
    explicit_content: "0",
    more_info: {},
  },
];

export const rawAllSearch: AllSearch = {
  topquery: {
    position: 1,
    data: [
      {
        id: "2393548",
        title: "Flipperachi",
        image: `${artworkPath}/artists/Flipperachi_000_150x150.jpg`,
        extra: "",
        type: "artist",
        description: "Artist",
        ctr: 0,
        entity: 1,
        isRadioPresent: true,
        position: 1,
      },
    ],
  },
  songs: {
    position: 2,
    data: [
      {
        id: "BSaNI3Yr",
        title: "FA9LA &amp; Friends",
        subtitle: "Flipperachi - Fa9la",
        type: "song",
        image: `${artworkPath}/fa9la-150x150.jpg`,
        perma_url: "https://www.jiosaavn.com/song/fa9la/BSaNI3Yr",
        explicit_content: "0",
        description: "",
        more_info: {
          album: "Fa9la",
          album_id: "1",
          ctr: 0,
          score: "1",
          primary_artists: "Flipperachi",
          singers: "Flipperachi",
          video_available: null,
          triller_available: false,
          language: "arabic",
        },
      },
    ],
  },
  albums: {
    position: 3,
    data: [
      {
        id: "82064668",
        title: "Udta Teer",
        subtitle: "Sachin-Jigar",
        type: "album",
        image: `${artworkPath}/845/Udta-Teer-150x150.jpg`,
        perma_url: "https://www.jiosaavn.com/album/udta-teer/LHgqn,SRpyA_",
        explicit_content: "0",
        description: "",
        more_info: {
          music: "Sachin-Jigar",
          ctr: 0,
          year: "2026",
          is_movie: "",
          language: "hindi",
          song_pids: "",
        },
      },
    ],
  },
  artists: {
    position: 4,
    data: [
      {
        id: "2393548",
        title: "Flipperachi",
        image: `${artworkPath}/artists/Flipperachi_000_150x150.jpg`,
        extra: "",
        type: "artist",
        description: "Artist",
        ctr: 0,
        entity: 1,
        isRadioPresent: true,
        position: 1,
      },
    ],
  },
  playlists: { position: 5, data: [] },
  shows: { position: 6, data: [] },
  episodes: { position: 7, data: [] },
};
