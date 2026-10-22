import { downloadLadder } from "@infinitunes/types/fixtures";
import { Directory, File } from "expo-file-system";
import { shareAsync } from "expo-sharing";
import { Platform } from "react-native";

import { downloadTrack, pickDownloadFolder, saveTracks } from "./download";
import { ensureNotificationPermission } from "./notifications";

type MockWritten = { name: string; mime: string | null };
const mockCreated: MockWritten[] = [];
const mockDeleted: string[] = [];
let mockWriteFails = false;
let mockExisting: string[] = [];

jest.mock("expo-file-system", () => {
  class MockFile {
    static downloadFileAsync = jest.fn(
      async (_url: string, destination: MockFile) => destination,
    );
    uri: string;
    constructor(...parts: string[]) {
      this.uri = parts.join("/");
    }
    bytes = jest.fn(async () => new Uint8Array([1]));
    delete = jest.fn(() => void mockDeleted.push(this.uri));
  }
  class MockDirectory {
    static pickDirectoryAsync = jest.fn();
    list = () => mockExisting.map((name) => ({ name }));
    createFile(name: string, mime: string | null) {
      // iOS: expo-file-system's createFile throws on an existing file.
      if (mockExisting.includes(name)) throw new Error("already exists");
      mockCreated.push({ name, mime });
      return {
        write: async () => {
          if (mockWriteFails) throw new Error("disk full");
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
jest.mock("./notifications", () => ({
  ensureNotificationPermission: jest.fn(async () => true),
}));

const track = (
  overrides: Partial<Parameters<typeof downloadTrack>[0]> = {},
) => ({
  name: "FA9LA",
  download_url: downloadLadder("songs/fa9la"),
  ...overrides,
});

const requestedUrl = () =>
  jest.mocked(File.downloadFileAsync).mock.calls.at(-1)?.[0];

beforeEach(() => {
  mockCreated.length = 0;
  mockDeleted.length = 0;
  mockWriteFails = false;
  mockExisting = [];
  jest.clearAllMocks();
});

describe("downloadTrack", () => {
  it("waits for the notification prompt before downloading, so it cannot overlap the share sheet", async () => {
    const prompt = Promise.withResolvers<boolean>();
    jest
      .mocked(ensureNotificationPermission)
      .mockReturnValueOnce(prompt.promise);
    const download = downloadTrack(track(), "high");
    await Promise.resolve();
    await Promise.resolve();
    expect(File.downloadFileAsync).not.toHaveBeenCalled();
    prompt.resolve(false);
    await download;
    expect(File.downloadFileAsync).toHaveBeenCalledTimes(1);
    expect(shareAsync).toHaveBeenCalledTimes(1);
  });

  it("still downloads when the permission check throws", async () => {
    jest
      .mocked(ensureNotificationPermission)
      .mockRejectedValueOnce(new Error("native"));
    await downloadTrack(track(), "high");
    expect(shareAsync).toHaveBeenCalledTimes(1);
  });

  it("keeps the shared file on Android until the receiver is done with it", async () => {
    jest.useFakeTimers();
    jest.replaceProperty(Platform, "OS", "android");
    try {
      await downloadTrack(track(), "high");
      expect(mockDeleted).toEqual([]);
      jest.advanceTimersByTime(120_000);
      expect(mockDeleted).toHaveLength(1);
    } finally {
      jest.useRealTimers();
      jest.restoreAllMocks();
    }
  });

  it("sweeps a still-pending Android share file on the next download", async () => {
    jest.useFakeTimers();
    jest.replaceProperty(Platform, "OS", "android");
    try {
      await downloadTrack(track(), "high");
      const first = jest.mocked(File.downloadFileAsync).mock.calls[0]?.[1].uri;
      await downloadTrack(track(), "high");
      expect(mockDeleted).toContain(first);
    } finally {
      jest.runAllTimers();
      jest.useRealTimers();
      jest.restoreAllMocks();
    }
  });

  it("isolates concurrent same-title downloads until each share finishes", async () => {
    const firstShare = Promise.withResolvers<void>();
    jest.mocked(shareAsync).mockReturnValueOnce(firstShare.promise);
    const first = downloadTrack(track(), "high");
    await new Promise((resolve) => setImmediate(resolve));
    await downloadTrack(track(), "high");

    const [firstFile, secondFile] = jest
      .mocked(File.downloadFileAsync)
      .mock.calls.map((call) => call[1]);
    expect(firstFile?.uri).not.toBe(secondFile?.uri);
    expect(mockDeleted).toEqual([secondFile?.uri]);
    firstShare.resolve();
    await first;
    expect(mockDeleted).toEqual([secondFile?.uri, firstFile?.uri]);
  });

  it("downloads the bitrate asked for and hands the file to the share sheet", async () => {
    await downloadTrack(track(), "excellent");

    expect(requestedUrl()).toBe("https://aac.saavncdn.com/songs/fa9la_320.mp4");
    expect(shareAsync).toHaveBeenCalledWith(
      expect.stringMatching(/^cache\/FA9LA-[a-z0-9-]+\.mp4$/),
      {
        mimeType: "audio/mp4",
        UTI: "public.mpeg-4-audio",
        dialogTitle: "FA9LA",
      },
    );
  });

  it("steps down to what the song has when it has no 320kbps", async () => {
    await downloadTrack(track({ maxQuality: "high" }), "excellent");

    expect(requestedUrl()).toBe("https://aac.saavncdn.com/songs/fa9la_160.mp4");
  });

  it("rejects without a link, and never reaches the share sheet", async () => {
    await expect(
      downloadTrack(track({ download_url: "" }), "high"),
    ).rejects.toThrow("This song can't be downloaded right now.");

    expect(File.downloadFileAsync).not.toHaveBeenCalled();
    expect(shareAsync).not.toHaveBeenCalled();
  });

  it("rejects when the CDN refuses, without sharing", async () => {
    for (let i = 0; i < 4; i += 1) {
      jest
        .mocked(File.downloadFileAsync)
        .mockRejectedValueOnce(new Error("404"));
    }

    await expect(downloadTrack(track(), "high")).rejects.toThrow("404");
    expect(shareAsync).not.toHaveBeenCalled();
  });

  it("names the file after the song with the characters a file system rejects removed", async () => {
    await downloadTrack(track({ name: 'AC/DC: "Back in Black"?' }), "low");

    expect(shareAsync).toHaveBeenCalledWith(
      expect.stringMatching(/^cache\/ACDC Back in Black-[a-z0-9-]+\.mp4$/),
      expect.anything(),
    );
  });

  it("falls back to 'track' for a name of only unsupported characters", async () => {
    await downloadTrack(track({ name: "???" }), "low");

    expect(shareAsync).toHaveBeenCalledWith(
      expect.stringMatching(/^cache\/track-[a-z0-9-]+\.mp4$/),
      expect.anything(),
    );
  });
});

describe("saveTracks", () => {
  it("waits for the notification prompt before saving", async () => {
    const prompt = Promise.withResolvers<boolean>();
    jest
      .mocked(ensureNotificationPermission)
      .mockReturnValueOnce(prompt.promise);
    const saving = saveTracks(new Directory(), [track()], "high");
    await Promise.resolve();
    await Promise.resolve();
    expect(File.downloadFileAsync).not.toHaveBeenCalled();
    prompt.resolve(true);
    await expect(saving).resolves.toEqual({ saved: 1, failed: 0 });
  });

  it("does not fail tracks whose file already exists in the folder on iOS", async () => {
    mockExisting = ["FA9LA.mp4", "FA9LA (2).mp4"];
    await expect(
      saveTracks(new Directory(), [track(), track()], "high"),
    ).resolves.toEqual({ saved: 2, failed: 0 });
    expect(mockCreated.map((file) => file.name)).toEqual([
      "FA9LA (3).mp4",
      "FA9LA (4).mp4",
    ]);
  });

  it("cleans the cached download up after saving it", async () => {
    await expect(
      saveTracks(new Directory(), [track()], "high"),
    ).resolves.toEqual({ saved: 1, failed: 0 });

    expect(mockDeleted).toEqual([
      jest.mocked(File.downloadFileAsync).mock.calls[0]?.[1].uri,
    ]);
  });

  it("counts a failed write and still cleans the cache up", async () => {
    mockWriteFails = true;

    await expect(
      saveTracks(new Directory(), [track()], "high"),
    ).resolves.toEqual({ saved: 0, failed: 1 });

    expect(mockDeleted).toEqual([
      jest.mocked(File.downloadFileAsync).mock.calls[0]?.[1].uri,
    ]);
  });

  it("saves an empty list as nothing saved", async () => {
    await expect(saveTracks(new Directory(), [], "high")).resolves.toEqual({
      saved: 0,
      failed: 0,
    });
    expect(mockCreated).toEqual([]);
  });

  it("leaves the extension to Android's document provider", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    try {
      await saveTracks(new Directory(), [track()], "high");
    } finally {
      jest.restoreAllMocks();
    }

    expect(mockCreated).toEqual([{ name: "FA9LA", mime: "audio/mp4" }]);
  });

  it("names the file with its extension on iOS", async () => {
    await saveTracks(new Directory(), [track()], "high");

    expect(mockCreated).toEqual([{ name: "FA9LA.mp4", mime: "audio/mp4" }]);
  });
});

describe("pickDownloadFolder", () => {
  it("is the folder the listener picked", async () => {
    const folder = new Directory();
    jest.mocked(Directory.pickDirectoryAsync).mockResolvedValueOnce(folder);

    await expect(pickDownloadFolder()).resolves.toBe(folder);
  });
});
