import { describe, expect, it, mock, spyOn } from "bun:test";

mock.module("server-only", () => ({}));

const MOCK_PASSWORD = "Password123!";
// bcrypt hash of MOCK_PASSWORD (apps/web does not depend on bcryptjs).
const mockPasswordHash =
  "$2b$04$/e1lPJxyxuthBkErU2qTiuIV4TKci6BlENLOPS79vO.TwXUwRHmYe";

let mockUser: { id: string; name?: string; email?: string } | undefined;
let mockPlaylist: { id: string; userId: string; songs: string[] } | null = null;
let mockFavorites: {
  userId: string;
  songs: string[];
  albums: string[];
  playlists: string[];
  artists: string[];
  podcasts: string[];
} | null = null;

// Counts session resolutions through the mocked auth module, so the
// recordPlay tests can prove the lookup happens once per play.
let sessionCalls = 0;

// Mock the auth module
mock.module("~/lib/auth", () => ({
  getUser: async () => mockUser,
  getSession: async () => {
    sessionCalls += 1;
    return mockUser ? { user: { id: mockUser.id } } : null;
  },
  getAuth: () => ({}),
  auth: {},
}));

// Mock the db module
mock.module("@infinitunes/db", () => ({
  db: {
    query: {
      myPlaylists: {
        findFirst: async () => mockPlaylist,
        findMany: async () => (mockPlaylist ? [mockPlaylist] : []),
      },
      favorites: {
        findFirst: async () => mockFavorites,
      },
      users: {
        findFirst: async () =>
          mockUser ? { id: mockUser.id, password: mockPasswordHash } : null,
      },
      betterAuthAccounts: {
        findFirst: async () => undefined,
      },
    },
    select: () => ({
      from: () => ({
        where: async () => [{ playlistsCount: 0 }],
      }),
    }),
    insert: () => ({
      values: (val: unknown) => ({
        returning: async () => [val],
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: async () => [mockPlaylist ?? mockFavorites ?? {}],
        }),
      }),
    }),
    delete: () => ({
      where: () => ({
        returning: async () => [{ id: mockUser?.id }],
      }),
    }),
  },
}));

// Mock next/cache
mock.module("next/cache", () => ({
  updateTag: () => {},
  unstable_cache: (fn: Function) => fn,
}));

// Mock next/navigation
mock.module("next/navigation", () => ({
  redirect: () => {},
}));

const {
  createNewPlaylist,
  deletePlaylist,
  deleteUser,
  renamePlaylist,
  updateUser,
} = await import("../lib/actions");
const {
  addSongsToPlaylist,
  addToFavorites,
  removeFromFavorites,
  removeSongsFromPlaylist,
} = await import("../lib/db/queries");
const { recordPlay } = await import("../lib/history-actions");

describe("Server action authorization security checks", () => {
  describe("When unauthenticated (no session user)", () => {
    it("rejects addToFavorites with Unauthorized", async () => {
      mockUser = undefined;
      await expect(addToFavorites("song_token", "song")).rejects.toThrow(
        "Unauthorized",
      );
    });

    it("rejects removeFromFavorites with Unauthorized", async () => {
      mockUser = undefined;
      await expect(removeFromFavorites("song_token", "song")).rejects.toThrow(
        "Unauthorized",
      );
    });

    it("rejects addSongsToPlaylist with Unauthorized", async () => {
      mockUser = undefined;
      await expect(
        addSongsToPlaylist("playlist-123", ["song-1"]),
      ).rejects.toThrow("Unauthorized");
    });

    it("rejects createNewPlaylist with Unauthorized", async () => {
      mockUser = undefined;
      await expect(
        createNewPlaylist({ name: "Hacked Playlist" }),
      ).rejects.toThrow("Unauthorized");
    });

    it("rejects renamePlaylist with Unauthorized", async () => {
      mockUser = undefined;
      await expect(
        renamePlaylist("playlist-123", { name: "Hacked Playlist" }),
      ).rejects.toThrow("Unauthorized");
    });

    it("rejects deletePlaylist with Unauthorized", async () => {
      mockUser = undefined;
      await expect(deletePlaylist("playlist-123")).rejects.toThrow(
        "Unauthorized",
      );
    });

    it("rejects removeSongsFromPlaylist with Unauthorized", async () => {
      mockUser = undefined;
      await expect(
        removeSongsFromPlaylist("playlist-123", 0, "song-1"),
      ).rejects.toThrow("Unauthorized");
    });

    it("rejects updateUser with Unauthorized", async () => {
      mockUser = undefined;
      await expect(updateUser({ name: "Attacker" })).rejects.toThrow(
        "Unauthorized",
      );
    });

    it("rejects deleteUser with Unauthorized", async () => {
      mockUser = undefined;
      await expect(deleteUser(MOCK_PASSWORD)).rejects.toThrow("Unauthorized");
    });
  });

  describe("When authenticated as user-123", () => {
    it("rejects addSongsToPlaylist for a playlist owned by user-456 (foreign playlist IDOR prevention)", async () => {
      mockUser = { id: "user-123" };
      mockPlaylist = {
        id: "playlist-victim",
        userId: "user-456", // Different user!
        songs: ["existing-song"],
      };

      await expect(
        addSongsToPlaylist("playlist-victim", ["attacker-song"]),
      ).rejects.toThrow("Unauthorized");
    });

    it("rejects playlist mutations for a foreign playlist", async () => {
      mockUser = { id: "user-123" };
      mockPlaylist = {
        id: "playlist-victim",
        userId: "user-456",
        songs: ["existing-song"],
      };

      await expect(
        removeSongsFromPlaylist("playlist-victim", 0, "existing-song"),
      ).rejects.toThrow("Unauthorized");
      await expect(
        renamePlaylist("playlist-victim", { name: "Stolen name" }),
      ).rejects.toThrow("Unauthorized");
      await expect(deletePlaylist("playlist-victim")).rejects.toThrow(
        "Unauthorized",
      );
    });

    it("allows addSongsToPlaylist for a playlist owned by session user", async () => {
      mockUser = { id: "user-123" };
      mockPlaylist = {
        id: "playlist-own",
        userId: "user-123", // Matching session user
        songs: ["existing-song"],
      };

      const result = await addSongsToPlaylist("playlist-own", ["new-song"]);
      expect(result).toBeDefined();
    });

    it("allows createNewPlaylist using session user ID without client passing userId", async () => {
      mockUser = { id: "user-123" };
      const result = await createNewPlaylist({
        name: "My New Playlist",
        description: "Test description",
      });
      expect(result).toBeDefined();
      expect(result.userId).toBe("user-123");
    });

    it("allows deleteUser using session user ID", async () => {
      mockUser = { id: "user-123" };
      const result = await deleteUser(MOCK_PASSWORD);
      expect(result).toBeDefined();
      expect(result.id).toBe("user-123");
    });

    it("rejects deleteUser with the wrong password", async () => {
      mockUser = { id: "user-123" };
      await expect(deleteUser("Wrong-Password1!")).rejects.toThrow(
        "Current password is incorrect",
      );
    });
  });

  describe("recordPlay history wrapper", () => {
    it("silently no-ops for logged-out users with one session lookup", async () => {
      mockUser = undefined;
      const err = spyOn(console, "error").mockImplementation(() => {});
      try {
        sessionCalls = 0;
        await expect(
          recordPlay({ id: "song-1", type: "song" }),
        ).resolves.toBeUndefined();
        expect(sessionCalls).toBe(1);
        expect(err).not.toHaveBeenCalled();
      } finally {
        err.mockRestore();
      }
    });

    it("resolves the session once per play and still logs failures", async () => {
      mockUser = { id: "user-123" };
      const err = spyOn(console, "error").mockImplementation(() => {});
      try {
        sessionCalls = 0;
        await expect(
          recordPlay({ id: "song-1", type: "song" }),
        ).resolves.toBeUndefined();
        expect(sessionCalls).toBe(1);
        expect(err).toHaveBeenCalled();
      } finally {
        err.mockRestore();
      }
    });
  });
});
