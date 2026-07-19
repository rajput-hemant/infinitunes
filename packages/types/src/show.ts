import type { ArtistMap } from "./artist";
import type { Quality, Rights } from "./misc";

export type Show = {
  show_details: ShowDetails;
  seasons: {
    id: string;
    name: string;
    subtitle: string;
    type: "season";
    image: Quality;
    url: string;
    explicit: boolean;
    entity_title_exact_match: string;
    description: string;
    parental_advisory: boolean;
    show_id: string;
    show_title: string;
    episodes_count: number;
    download_url: Quality;
    season_number: number;
    artist_map: ArtistMap;
  }[];
  episodes: Episode[];
  modules: {
    seasons: {
      source: string;
      position: number;
      title: string;
      subtitle: string;
    };
    episodes: {
      source: string;
      position: number;
      title: string;
      subtitle: string;
    };
    show_details: {
      source: string;
      position: number;
      title: string;
      subtitle: string;
    };
    show_starring: {
      source: string;
      position: number;
      title: string;
      subtitle: string;
    };
  };
};

export type ShowDetails = {
  id: string;
  name: string;
  subtitle: string;
  header_desc: string;
  type: "show";
  url: string;
  image: Quality;
  language: string;
  year: number;
  play_count: number;
  explicit: boolean;
  list_count: number;
  list_type: string;
  list: string;
  country_of_origin: string;
  description: string;
  label_id: string;
  latest_season_id: number;
  latest_season_sequence: number;
  parental_advisory: boolean;
  partner_id: number;
  partner_name: string;
  release_date: string;
  tags: string;
  followers_count: number;
  copyright_text: string;
  category_tags: string[];
  sub_category_tags: string[];
  artist_map: ArtistMap;
  header_logo: string;
  header_color: string;
  header_image: string;
  label: string;
  sort_order: string;
  season_image: Quality;
  editors_note: {
    title: string;
    message: string;
    image: string;
    content: string[];
  };
  season_number: number;
  total_episodes: number;
  fan_count: number;
  is_followed: boolean;
};

export type EpisodeDetail = {
  episodes: Episode[];
  modules: {
    episode_details: {
      source: string;
      position: number;
      title: string;
      subtitle: string;
    };
    episode_starring: {
      source: string;
      position: number;
      title: string;
      subtitle: string;
    };
  };
};

export type Episode = {
  id: string;
  name: string;
  subtitle: string;
  header_desc: string;
  type: "episode";
  url: string;
  image: Quality;
  language: string;
  year: number;
  play_count: number;
  explicit: boolean;
  list_count: number;
  list_type: string;
  list: string;
  release_date: string;
  label_id: string;
  duration: number;
  entity_title_exact_match: string;
  description: string;
  season_no: number;
  episode_number: number;
  show_id: string;
  season_id: string;
  show_title: string;
  season_title: string;
  artist_map: ArtistMap;
  label: string;
  origin: string;
  rights: Rights;
  starred: boolean;
  show_url: string;
  download_url: Quality;
};
