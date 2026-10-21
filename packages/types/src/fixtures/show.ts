import type { Episode, Season, Show, ShowDetails } from "../show";
import { downloadLadder } from "./song";

/**
 * Raw show payloads as upstream sends them: `show_details.type` is `"show"`,
 * episodes are keyed by numeric `id` plus `more_info.season_no`, seasons are
 * listed oldest first and share the show's perma token. Overrides are shallow.
 */

export const SHOW_TOKEN = "mXtDJ4Yd2Sw_";
export const EPISODE_TOKEN = "Ub3k8aNq1Zc_";

const SHOW_URL = `https://www.jiosaavn.com/shows/the-ranveer-show/2/${SHOW_TOKEN}`;

const noArtists = { primary_artists: [], featured_artists: [], artists: [] };

export function rawSeason(
  number: number,
  overrides: Partial<Season> = {},
): Season {
  return {
    id: `1000${number}`,
    title: `Season ${number}`,
    subtitle: "",
    type: "season",
    image: "https://c.saavncdn.com/shows/season-150x150.jpg",
    perma_url: `https://www.jiosaavn.com/shows/the-ranveer-show/${number}/${SHOW_TOKEN}`,
    explicit_content: "0",
    more_info: {
      entity_title_exact_match: "",
      description: "",
      song_info: "",
      show_id: "5555",
      show_title: "The Ranveer Show",
      numEpisodes: number === 1 ? "2" : "3",
      encrypted_media_url: "",
      season_number: String(number),
      artistMap: noArtists,
    },
    ...overrides,
  };
}

export function rawEpisode(
  id: string,
  overrides: Partial<Episode> = {},
): Episode {
  return {
    id,
    title: `Episode ${id} &amp; more`,
    subtitle: "The Ranveer Show",
    header_desc: "",
    type: "episode",
    perma_url: `https://www.jiosaavn.com/shows/the-ranveer-show/ep-${id}/${EPISODE_TOKEN}`,
    image: "https://c.saavncdn.com/shows/episode-150x150.jpg",
    language: "hindi",
    year: "2026",
    play_count: "12500",
    explicit_content: "0",
    list_count: "0",
    list_type: "",
    list: "",
    more_info: {
      release_date: "2026-03-01",
      release_time: "",
      label_id: "",
      duration: "3725",
      square_image_url: "",
      entity_title_exact_match: "",
      description: "<p>First <b>paragraph</b>.<br>Second line &amp; more.</p>",
      season_no: "2",
      sequence_number: "1",
      show_id: "5555",
      season_id: "10002",
      show_title: "The Ranveer Show",
      season_title: "Season 2",
      square_image: "",
      artistMap: noArtists,
      episode_number: "1",
      label: "",
      origin: "none",
      ad_breaks: "",
      multi_br: "",
      rights: {
        code: "0",
        cacheable: "true",
        delete_cached_object: "false",
        reason: "",
      },
      starred: "false",
      cache_state: "false",
      show_url: SHOW_URL,
      encrypted_media_url:
        "ID2ieOjCrwfgWvL5sXl4B1ImC5QfbsDyCT9PVzZhp8wX5LfB8n7R",
    },
    download_url: downloadLadder(`episodes/${id}`),
    ...overrides,
  };
}

const showDetails: ShowDetails = {
  id: "5555",
  title: "The Ranveer Show &amp; Friends",
  subtitle: "Talks",
  header_desc: "",
  type: "show",
  perma_url: SHOW_URL,
  image: "https://c.saavncdn.com/shows/ranveer-500x500.jpg",
  language: "hindi",
  year: "2026",
  play_count: "",
  explicit_content: "0",
  list_count: "0",
  list_type: "",
  list: "",
  more_info: {
    country_of_origin: "IN",
    description: "<p>Conversations with <b>creators</b>.</p>",
    disable_ads: "0",
    is_disabled: "0",
    label_id: "",
    latest_season_id: "10002",
    latest_season_sequence: "2",
    parental_advisory: "0",
    partner_id: "",
    partner_name: "",
    release_date: "2026-01-01",
    tags: "",
    followers_count: "0",
    copyright_text: "",
    category_tags: [],
    sub_category_tags: [],
    m4a: "",
    artistMap: noArtists,
    header_logo: "",
    header_color: "",
    header_image: "",
    label: "",
    sort_order: "",
    square_image: "",
    editors_note: { title: "", message: "", image: "", content: [] },
    season_number: "2",
    total_episodes: "3",
    is_followed: "false",
    fan_count: "2300",
  },
};

export function rawShow(overrides: Partial<Show> = {}): Show {
  return {
    show_details: showDetails,
    seasons: [rawSeason(1), rawSeason(2)],
    episodes: [rawEpisode("9001"), rawEpisode("9002")],
    modules: {
      seasons: { source: "show", position: 2, title: "Seasons", subtitle: "" },
      episodes: {
        source: "show",
        position: 3,
        title: "Episodes",
        subtitle: "",
      },
      show_details: {
        source: "show",
        position: 1,
        title: "About",
        subtitle: "",
      },
      show_starring: {
        source: "show",
        position: 4,
        title: "Starring",
        subtitle: "",
      },
    },
    ...overrides,
  };
}
