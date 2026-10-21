import { toSongRow } from "@infinitunes/types";
import { rawSong } from "@infinitunes/types/fixtures";
import { Directory, File } from "expo-file-system";

import { pickDownloadFolder, saveTracks } from "./download";

const written: { name: string; mime: string | null; size: number }[] = [];

jest.mock("expo-file-system", () => {
  class MockFile {
    static downloadFileAsync = jest.fn(
      async (_url: string, destination: MockFile) => destination,
    );
    uri: string;
    constructor(...parts: string[]) {
      this.uri = parts.join("/");
    }
    bytes = jest.fn(async () => new Uint8Array([1, 2, 3]));
    delete = jest.fn();
  }
  class MockDirectory {
    static pickDirectoryAsync = jest.fn();
    createFile(name: string, mime: string | null) {
      return {
        write: async (bytes: Uint8Array) => {
          written.push({ name, mime, size: bytes.length });
        },
      };
    }
  }
  return {
    File: MockFile,
    Directory: MockDirectory,
    Paths: { cache: "cache" },
  };
});
jest.mock("expo-sharing", () => ({ shareAsync: jest.fn() }));

beforeEach(() => {
  written.length = 0;
});

describe("saveTracks", () => {
  it("saves each song into the folder and counts the ones without a link", async () => {
    const playable = toSongRow(rawSong({ title: "FA9LA &amp; Friends" }));
    const linkless = { ...toSongRow(rawSong({ id: "x" })), download_url: "" };

    const result = await saveTracks(
      new Directory(),
      [playable, linkless],
      "high",
    );

    expect(result).toEqual({ saved: 1, failed: 1 });
    expect(written).toEqual([
      { name: "FA9LA Friends.mp4", mime: "audio/mp4", size: 3 },
    ]);
    expect(jest.mocked(File.downloadFileAsync)).toHaveBeenCalledTimes(1);
  });

  it("keeps going when one download fails", async () => {
    jest.mocked(File.downloadFileAsync).mockRejectedValueOnce(new Error("404"));
    const songs = [rawSong({ id: "a" }), rawSong({ id: "b" })].map(toSongRow);

    const result = await saveTracks(new Directory(), songs, "high");

    expect(result).toEqual({ saved: 1, failed: 1 });
  });
});

describe("pickDownloadFolder", () => {
  it("is null when the listener dismisses the picker", async () => {
    jest
      .mocked(Directory.pickDirectoryAsync)
      .mockRejectedValueOnce(new Error("cancelled"));

    await expect(pickDownloadFolder()).resolves.toBeNull();
  });
});
