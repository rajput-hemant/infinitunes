import type { Radio } from "../get";
import type { Modules } from "../modules";
import type { StationDetailsResponse } from "../radio";
import { rawAlbum, rawChart, rawPlaylist } from "./collections";
import { rawSong } from "./song";

/** Raw radio stations and the launch-data payload (`home.home`) that lists them. */

export function rawStation(overrides: Partial<Radio> = {}): Radio {
  const id = overrides.id ?? "station-1";
  return {
    id,
    title: "Hindi Hits &amp; More",
    subtitle: "Hindi Radio",
    type: "radio_station",
    image: "https://c.saavncdn.com/radio/hindi-hits-150x150.jpg?bch=1",
    perma_url: `https://www.saavn.com/s/radio/hindi-featured-station/${id}`,
    explicit_content: "0",
    more_info: {
      featured_station_type: "featured",
      language: "hindi",
      station_display_text: "Hindi Hits",
      query: "",
    },
    ...overrides,
  };
}

export function rawStationDetails(
  overrides: Partial<StationDetailsResponse> = {},
): StationDetailsResponse {
  return {
    station: rawStation(),
    stationId: "session-42",
    songs: [rawSong(), rawSong({ id: "Ab12Cd34", title: "Second Song" })],
    ...overrides,
  };
}

/** A launch-data payload with the typed sections and their `modules` titles. */
export function rawLaunchData(overrides: Partial<Modules> = {}): Modules {
  return {
    new_albums: [rawAlbum()],
    new_trending: [],
    browse_discover: [],
    charts: [rawChart()],
    radio: [rawStation()],
    top_playlists: [
      rawPlaylist({ id: "p1", title: "Featured Mix" }),
      rawPlaylist({ id: "p2", title: "Second Playlist" }),
    ],
    global_config: {
      random_songs_listid: {},
      weekly_top_songs_listid: {},
    },
    modules: {
      new_albums: {
        source: "new_albums",
        position: 1,
        title: "New Releases",
        subtitle: "",
      },
      charts: { source: "charts", position: 2, title: "Charts", subtitle: "" },
      radio: {
        source: "radio",
        position: 3,
        title: "Radio Stations",
        subtitle: "",
      },
    },
    ...overrides,
  };
}
