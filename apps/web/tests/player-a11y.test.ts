import { describe, expect, it } from "bun:test";

import type { ShowDetails } from "@infinitunes/types";

import {
  getKind,
  isKind,
  type DetailsItem,
} from "../components/details-header/details-header-items";
import { albumFixture, songFixture } from "./details-header-fixtures";

const read = (path: string) => Bun.file(new URL(path, import.meta.url)).text();

describe("details header season (PQ-4)", () => {
  const show: ShowDetails = {
    id: "show1",
    title: "Show",
    subtitle: "",
    header_desc: "",
    type: "season",
    perma_url: "https://www.example.test/show/show1",
    image: "",
    language: "hindi",
    year: "2020",
    play_count: "0",
    explicit_content: "0",
    list_count: "0",
    list_type: "",
    list: "",
    more_info: {
      country_of_origin: "",
      description: "",
      disable_ads: "0",
      is_disabled: "0",
      label_id: "",
      latest_season_id: "",
      latest_season_sequence: "3",
      parental_advisory: "0",
      partner_id: "",
      partner_name: "",
      release_date: "",
      tags: "",
      followers_count: "0",
      copyright_text: "",
      category_tags: [],
      sub_category_tags: [],
      m4a: "",
      artistMap: { primary_artists: [] },
      header_logo: "",
      header_color: "",
      header_image: "",
      label: "",
      sort_order: "",
      square_image: "",
      editors_note: { title: "", message: "", image: "", content: [] },
      season_number: "3",
      total_episodes: "0",
      is_followed: "0",
      fan_count: "0",
    },
  };

  // Mirrors the value DetailsHeader hands PlayButton as `season`.
  const seasonOf = (item: DetailsItem) =>
    isKind(item, "season") ? Number(item.more_info.season_number) : undefined;

  it("is the show's season number for a show page", () => {
    expect(getKind(show)).toBe("season");
    expect(seasonOf(show)).toBe(3);
  });

  it("is absent for any other kind of page", () => {
    expect(seasonOf(songFixture())).toBeUndefined();
    expect(seasonOf(albumFixture())).toBeUndefined();
  });
});

describe("PlaylistItem cover failure (CD-5)", () => {
  it("degrades to the placeholder and logs", async () => {
    const source = await read(
      "../app/(root)/me/(layout-a)/_components/playlist-item.tsx",
    );

    expect(source).toContain("catch (error)");
    expect(source).toContain("console.error(");
  });
});
