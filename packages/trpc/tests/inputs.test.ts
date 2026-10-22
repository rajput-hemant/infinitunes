import { describe, expect, it } from "bun:test";

import {
  albumInput,
  albumSameYearInput,
  artistInput,
  createStationInput,
  getFooterInput,
  getPagedInput,
  radioSongsInput,
  searchAllInput,
  searchByTypeInput,
  showEpisodesInput,
  showInput,
  songInput,
  songItemsInput,
} from "../src/lib/inputs";

describe("catalog input bounds (S-13, S-14)", () => {
  describe("string bounds (.max(200))", () => {
    it("accepts strings up to 200 characters", () => {
      const str200 = "a".repeat(200);
      expect(searchAllInput.parse({ q: str200 })).toEqual({ q: str200 });
      expect(songInput.parse({ id: str200, token: str200 })).toEqual({
        id: str200,
        token: str200,
      });
      expect(albumInput.parse({ id: str200, token: str200 })).toEqual({
        id: str200,
        token: str200,
      });
      expect(
        searchByTypeInput.parse({
          type: "songs",
          q: str200,
          page: 1,
          n: 10,
        }),
      ).toMatchObject({
        type: "songs",
        q: str200,
        page: 1,
        n: 10,
      });
      expect(
        createStationInput.parse({
          name: str200,
          artistId: str200,
          query: str200,
          mode: str200,
        }),
      ).toMatchObject({
        name: str200,
        artistId: str200,
        query: str200,
        mode: str200,
      });
    });

    it("rejects strings longer than 200 characters", () => {
      const str201 = "a".repeat(201);
      expect(() => searchAllInput.parse({ q: str201 })).toThrow();
      expect(() => songInput.parse({ id: str201 })).toThrow();
      expect(() => songInput.parse({ token: str201 })).toThrow();
      expect(() => albumInput.parse({ id: str201 })).toThrow();
      expect(() =>
        searchByTypeInput.parse({ type: "songs", q: str201 }),
      ).toThrow();
      expect(() => createStationInput.parse({ name: str201 })).toThrow();
      expect(() => radioSongsInput.parse({ stationId: str201 })).toThrow();
    });

    it("allows comma-separated songItemsInput.id up to 1000 characters", () => {
      const id1000 = "a".repeat(1000);
      expect(songItemsInput.parse({ id: id1000 })).toEqual({ id: id1000 });
      expect(() => songItemsInput.parse({ id: "a".repeat(1001) })).toThrow();
    });
  });

  describe("language bounds (.max(300))", () => {
    it("accepts language strings up to 300 characters", () => {
      const lang300 = "a".repeat(300);
      expect(songInput.parse({ lang: lang300 })).toEqual({ lang: lang300 });
      expect(
        createStationInput.parse({ name: "station", language: lang300 }),
      ).toMatchObject({
        language: lang300,
      });
    });

    it("rejects language strings longer than 300 characters", () => {
      const lang301 = "a".repeat(301);
      expect(() => songInput.parse({ lang: lang301 })).toThrow();
      expect(() =>
        createStationInput.parse({ name: "station", language: lang301 }),
      ).toThrow();
    });
  });

  describe("page bounds (.int().min(0).max(1000))", () => {
    it("accepts integer pages between 0 and 1000", () => {
      expect(getPagedInput.parse({ page: 0 })).toEqual({ page: 0 });
      expect(getPagedInput.parse({ page: 1000 })).toEqual({ page: 1000 });
      expect(getPagedInput.parse({ page: "5" })).toEqual({ page: 5 });
    });

    it("rejects invalid page numbers", () => {
      expect(() => getPagedInput.parse({ page: -1 })).toThrow();
      expect(() => getPagedInput.parse({ page: 1001 })).toThrow();
      expect(() => getPagedInput.parse({ page: 1.5 })).toThrow();
      expect(() => getPagedInput.parse({ page: "abc" })).toThrow();
    });
  });

  describe("count bounds (.int().min(1).max(100))", () => {
    it("accepts counts between 1 and 100", () => {
      expect(getPagedInput.parse({ n: 1 })).toEqual({ n: 1 });
      expect(getPagedInput.parse({ n: 100 })).toEqual({ n: 100 });
      expect(getPagedInput.parse({ n: "20" })).toEqual({ n: 20 });
      expect(artistInput.parse({ n_song: 50, n_album: 50 })).toMatchObject({
        n_song: 50,
        n_album: 50,
      });
    });

    it("rejects invalid counts", () => {
      expect(() => getPagedInput.parse({ n: 0 })).toThrow();
      expect(() => getPagedInput.parse({ n: 101 })).toThrow();
      expect(() => getPagedInput.parse({ n: 2.5 })).toThrow();
      expect(() => getPagedInput.parse({ n: "abc" })).toThrow();
      expect(() => artistInput.parse({ n_song: 0 })).toThrow();
      expect(() => artistInput.parse({ n_album: 101 })).toThrow();
    });
  });

  describe("year regex (/^\\d{4}$/)", () => {
    it("accepts exactly 4 digit years", () => {
      expect(albumSameYearInput.parse({ year: "2024" })).toEqual({
        year: "2024",
      });
      expect(albumSameYearInput.parse({ year: "1999" })).toEqual({
        year: "1999",
      });
    });

    it("rejects non-4-digit strings for year", () => {
      expect(() => albumSameYearInput.parse({ year: "202" })).toThrow();
      expect(() => albumSameYearInput.parse({ year: "20245" })).toThrow();
      expect(() => albumSameYearInput.parse({ year: "abcd" })).toThrow();
      expect(() => albumSameYearInput.parse({ year: "20 4" })).toThrow();
    });
  });

  describe("season and radio next bounds", () => {
    it("accepts valid season and next", () => {
      expect(showInput.parse({ season: 1 })).toMatchObject({ season: 1 });
      expect(
        showEpisodesInput.parse({ id: "show1", season: 10 }),
      ).toMatchObject({
        season: 10,
      });
      expect(
        radioSongsInput.parse({ stationId: "s1", next: 0, k: 20 }),
      ).toMatchObject({ next: 0, k: 20 });
    });

    it("rejects invalid season or next", () => {
      expect(() => showInput.parse({ season: 0 })).toThrow();
      expect(() => showInput.parse({ season: 101 })).toThrow();
      expect(() =>
        radioSongsInput.parse({ stationId: "s1", next: -1 }),
      ).toThrow();
      expect(() =>
        radioSongsInput.parse({ stationId: "s1", next: 1001 }),
      ).toThrow();
    });
  });

  describe("getFooterInput (S-14)", () => {
    it("makes lang optional", () => {
      expect(getFooterInput.parse({})).toEqual({});
      expect(getFooterInput.parse({ lang: "hindi" })).toEqual({
        lang: "hindi",
      });
    });

    it("enforces bounds on footer inputs", () => {
      expect(() => getFooterInput.parse({ lang: "a".repeat(301) })).toThrow();
      expect(() => getFooterInput.parse({ page: -1 })).toThrow();
      expect(() => getFooterInput.parse({ n: 0 })).toThrow();
    });
  });
});
