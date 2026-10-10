import { describe, expect, it, mock } from "bun:test";

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

// Mock the auth module
mock.module("~/lib/auth", () => ({
  getUser: async () => mockUser,
  getSession: async () => (mockUser ? { user: { id: mockUser.id } } : null),
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
        findFirst: async () => (mockUser ? { id: mockUser.id } : null),
      },
      betterAuthAccounts: {
        findFirst: async () =>
          mockUser
            ? {
                userId: mockUser.id,
                providerId: "credential",
                password: mockPasswordHash,
              }
            : undefined,
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

const { unwrap } = await import("../../lib/action-result");
const {
  createNewPlaylist,
  deletePlaylist,
  deleteUser,
  renamePlaylist,
  updateUser,
} = await import("../../lib/actions");
const {
  addSongsToPlaylist,
  addToFavorites,
  removeFromFavorites,
  removeSongsFromPlaylist,
} = await import("../../lib/db/queries");

describe("Server action authorization security checks", () => {
  describe("When unauthenticated (no session user)", () => {
    it("rejects addToFavorites with Unauthorized", async () => {
      mockUser = undefined;
      await expect(
        unwrap(addToFavorites("song_token", "song")),
      ).rejects.toThrow("Unauthorized");
    });

    it("rejects removeFromFavorites with Unauthorized", async () => {
      mockUser = undefined;
      await expect(
        unwrap(removeFromFavorites("song_token", "song")),
      ).rejects.toThrow("Unauthorized");
    });

    it("rejects addSongsToPlaylist with Unauthorized", async () => {
      mockUser = undefined;
      await expect(
        unwrap(addSongsToPlaylist("playlist-123", ["song-1"])),
      ).rejects.toThrow("Unauthorized");
    });

    it("rejects createNewPlaylist with Unauthorized", async () => {
      mockUser = undefined;
      await expect(
        unwrap(createNewPlaylist({ name: "Hacked Playlist" })),
      ).rejects.toThrow("Unauthorized");
    });

    it("rejects renamePlaylist with Unauthorized", async () => {
      mockUser = undefined;
      await expect(
        unwrap(renamePlaylist("playlist-123", { name: "Hacked Playlist" })),
      ).rejects.toThrow("Unauthorized");
    });

    it("rejects deletePlaylist with Unauthorized", async () => {
      mockUser = undefined;
      await expect(unwrap(deletePlaylist("playlist-123"))).rejects.toThrow(
        "Unauthorized",
      );
    });

    it("rejects removeSongsFromPlaylist with Unauthorized", async () => {
      mockUser = undefined;
      await expect(
        unwrap(removeSongsFromPlaylist("playlist-123", 0, "song-1")),
      ).rejects.toThrow("Unauthorized");
    });

    it("rejects updateUser with Unauthorized", async () => {
      mockUser = undefined;
      await expect(unwrap(updateUser({ name: "Attacker" }))).rejects.toThrow(
        "Unauthorized",
      );
    });

    it("rejects deleteUser with Unauthorized", async () => {
      mockUser = undefined;
      await expect(unwrap(deleteUser(MOCK_PASSWORD))).rejects.toThrow(
        "Unauthorized",
      );
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
        unwrap(addSongsToPlaylist("playlist-victim", ["attacker-song"])),
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
        unwrap(removeSongsFromPlaylist("playlist-victim", 0, "existing-song")),
      ).rejects.toThrow("Unauthorized");
      await expect(
        unwrap(renamePlaylist("playlist-victim", { name: "Stolen name" })),
      ).rejects.toThrow("Unauthorized");
      await expect(unwrap(deletePlaylist("playlist-victim"))).rejects.toThrow(
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

      const result = await unwrap(
        addSongsToPlaylist("playlist-own", ["new-song"]),
      );
      expect(result).toBeDefined();
    });

    it("allows createNewPlaylist using session user ID without client passing userId", async () => {
      mockUser = { id: "user-123" };
      const result = await unwrap(
        createNewPlaylist({
          name: "My New Playlist",
          description: "Test description",
        }),
      );
      expect(result).toBeDefined();
      expect(result.userId).toBe("user-123");
    });

    it("allows deleteUser using session user ID", async () => {
      mockUser = { id: "user-123" };
      const result = await unwrap(deleteUser(MOCK_PASSWORD));
      expect(result).toBeDefined();
      expect(result.id).toBe("user-123");
    });

    it("returns a coded result instead of throwing", async () => {
      mockUser = undefined;
      expect(await deletePlaylist("playlist-123")).toMatchObject({
        ok: false,
        code: "UNAUTHORIZED",
      });
    });

    it("rejects deleteUser with the wrong password", async () => {
      mockUser = { id: "user-123" };
      await expect(unwrap(deleteUser("Wrong-Password1!"))).rejects.toThrow(
        "Current password is incorrect",
      );
    });
  });

  describe("coded action results", () => {
    const unauthorized = {
      ok: false,
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    };
    const forbidden = { ok: false, code: "FORBIDDEN", message: "Unauthorized" };

    it("returns UNAUTHORIZED results for logged-out callers", async () => {
      mockUser = undefined;
      await expect(addToFavorites("song_token", "song")).resolves.toEqual(
        unauthorized,
      );
      await expect(removeFromFavorites("song_token", "song")).resolves.toEqual(
        unauthorized,
      );
      await expect(
        addSongsToPlaylist("playlist-123", ["song-1"]),
      ).resolves.toEqual(unauthorized);
      await expect(
        createNewPlaylist({ name: "Hacked Playlist" }),
      ).resolves.toEqual(unauthorized);
      await expect(
        renamePlaylist("playlist-123", { name: "Hacked Playlist" }),
      ).resolves.toEqual(unauthorized);
      await expect(deletePlaylist("playlist-123")).resolves.toEqual(
        unauthorized,
      );
      await expect(
        removeSongsFromPlaylist("playlist-123", 0, "song-1"),
      ).resolves.toEqual(unauthorized);
      await expect(updateUser({ name: "Attacker" })).resolves.toEqual(
        unauthorized,
      );
      await expect(deleteUser(MOCK_PASSWORD)).resolves.toEqual(unauthorized);
    });

    it("returns FORBIDDEN results for a foreign playlist", async () => {
      mockUser = { id: "user-123" };
      mockPlaylist = {
        id: "playlist-victim",
        userId: "user-456",
        songs: ["existing-song"],
      };
      await expect(
        addSongsToPlaylist("playlist-victim", ["attacker-song"]),
      ).resolves.toEqual(forbidden);
      await expect(
        removeSongsFromPlaylist("playlist-victim", 0, "existing-song"),
      ).resolves.toEqual(forbidden);
      await expect(
        renamePlaylist("playlist-victim", { name: "Stolen name" }),
      ).resolves.toEqual(forbidden);
      await expect(deletePlaylist("playlist-victim")).resolves.toEqual(
        forbidden,
      );
    });

    it("returns ok results carrying the data", async () => {
      mockUser = { id: "user-123" };
      mockPlaylist = {
        id: "playlist-own",
        userId: "user-123",
        songs: ["existing-song"],
      };
      expect(
        await addSongsToPlaylist("playlist-own", ["new-song"]),
      ).toMatchObject({ ok: true });
      expect(
        await addSongsToPlaylist("playlist-own", ["new-song"]),
      ).toHaveProperty("data");
      expect(
        await createNewPlaylist({
          name: "My New Playlist",
          description: "Test description",
        }),
      ).toMatchObject({ ok: true, data: { userId: "user-123" } });
      expect(await deleteUser(MOCK_PASSWORD)).toMatchObject({
        ok: true,
        data: { id: "user-123" },
      });
    });

    it("returns BAD_REQUEST for the wrong password", async () => {
      mockUser = { id: "user-123" };
      await expect(deleteUser("Wrong-Password1!")).resolves.toEqual({
        ok: false,
        code: "BAD_REQUEST",
        message: "Current password is incorrect",
      });
    });
  });
});
