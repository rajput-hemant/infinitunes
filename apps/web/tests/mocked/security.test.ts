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
  requestEmailChange: async () => {},
  auth: {},
}));

// Mock the db module
const fakeDb = {
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
      // A playlist count, or (`.for("update")`) the locked playlist row.
      where: () =>
        Object.assign(Promise.resolve([{ playlistsCount: 0 }]), {
          for: async () => (mockPlaylist ? [mockPlaylist] : []),
        }),
    }),
  }),
  transaction: async (fn: (tx: typeof fakeDb) => Promise<unknown>) =>
    fn(fakeDb),
  // The per-user advisory lock playlist creates take.
  execute: async () => [],
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
};
mock.module("@infinitunes/db", () => ({ db: fakeDb }));

// Mock next/cache
mock.module("next/cache", () => ({
  refresh: () => {},
  cacheLife: () => {},
  cacheTag: () => {},
  unstable_cache: (fn: Function) => fn,
}));

// Mock next/navigation
mock.module("next/navigation", () => ({
  redirect: () => {},
}));

const { unwrap } = await import("../../lib/action-result");
const {
  addSongsToPlaylist,
  addToFavorites,
  createNewPlaylist,
  deletePlaylist,
  deleteUser,
  removeFromFavorites,
  removeSongsFromPlaylist,
  renamePlaylist,
  updateUser,
} = await import("../../lib/actions");

describe("Server action authorization security checks", () => {
  describe("When unauthenticated (no session user)", () => {
    it("rejects addToFavorites with sign-in copy", async () => {
      mockUser = undefined;
      await expect(
        unwrap(addToFavorites("song_token", "song")),
      ).rejects.toThrow("Please sign in to continue.");
    });

    it("rejects removeFromFavorites with sign-in copy", async () => {
      mockUser = undefined;
      await expect(
        unwrap(removeFromFavorites("song_token", "song")),
      ).rejects.toThrow("Please sign in to continue.");
    });

    it("rejects addSongsToPlaylist with sign-in copy", async () => {
      mockUser = undefined;
      await expect(
        unwrap(
          addSongsToPlaylist("00000000-0000-4000-8000-000000000123", [
            "song-1",
          ]),
        ),
      ).rejects.toThrow("Please sign in to continue.");
    });

    it("rejects createNewPlaylist with sign-in copy", async () => {
      mockUser = undefined;
      await expect(
        unwrap(createNewPlaylist({ name: "Hacked Playlist" })),
      ).rejects.toThrow("Please sign in to continue.");
    });

    it("rejects renamePlaylist with sign-in copy", async () => {
      mockUser = undefined;
      await expect(
        unwrap(
          renamePlaylist("00000000-0000-4000-8000-000000000123", {
            name: "Hacked Playlist",
          }),
        ),
      ).rejects.toThrow("Please sign in to continue.");
    });

    it("rejects deletePlaylist with sign-in copy", async () => {
      mockUser = undefined;
      await expect(
        unwrap(deletePlaylist("00000000-0000-4000-8000-000000000123")),
      ).rejects.toThrow("Please sign in to continue.");
    });

    it("rejects removeSongsFromPlaylist with sign-in copy", async () => {
      mockUser = undefined;
      await expect(
        unwrap(
          removeSongsFromPlaylist(
            "00000000-0000-4000-8000-000000000123",
            0,
            "song-1",
          ),
        ),
      ).rejects.toThrow("Please sign in to continue.");
    });

    it("rejects updateUser with sign-in copy", async () => {
      mockUser = undefined;
      await expect(unwrap(updateUser({ name: "Attacker" }))).rejects.toThrow(
        "Please sign in to continue.",
      );
    });

    it("rejects deleteUser with sign-in copy", async () => {
      mockUser = undefined;
      await expect(unwrap(deleteUser(MOCK_PASSWORD))).rejects.toThrow(
        "Please sign in to continue.",
      );
    });
  });

  describe("When authenticated as user-123", () => {
    it("rejects addSongsToPlaylist for a playlist owned by user-456 (foreign playlist IDOR prevention)", async () => {
      mockUser = { id: "user-123" };
      mockPlaylist = {
        id: "00000000-0000-4000-8000-0000000000bb",
        userId: "user-456", // Different user!
        songs: ["existing-song"],
      };

      await expect(
        unwrap(
          addSongsToPlaylist("00000000-0000-4000-8000-0000000000bb", [
            "attacker-song",
          ]),
        ),
      ).rejects.toThrow("Unauthorized");
    });

    it("rejects playlist mutations for a foreign playlist", async () => {
      mockUser = { id: "user-123" };
      mockPlaylist = {
        id: "00000000-0000-4000-8000-0000000000bb",
        userId: "user-456",
        songs: ["existing-song"],
      };

      await expect(
        unwrap(
          removeSongsFromPlaylist(
            "00000000-0000-4000-8000-0000000000bb",
            0,
            "existing-song",
          ),
        ),
      ).rejects.toThrow("Unauthorized");
      await expect(
        unwrap(
          renamePlaylist("00000000-0000-4000-8000-0000000000bb", {
            name: "Stolen name",
          }),
        ),
      ).rejects.toThrow("Unauthorized");
      await expect(
        unwrap(deletePlaylist("00000000-0000-4000-8000-0000000000bb")),
      ).rejects.toThrow("Unauthorized");
    });

    it("allows addSongsToPlaylist for a playlist owned by session user", async () => {
      mockUser = { id: "user-123" };
      mockPlaylist = {
        id: "00000000-0000-4000-8000-0000000000aa",
        userId: "user-123", // Matching session user
        songs: ["existing-song"],
      };

      const result = await unwrap(
        addSongsToPlaylist("00000000-0000-4000-8000-0000000000aa", [
          "new-song",
        ]),
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
      expect(
        await deletePlaylist("00000000-0000-4000-8000-000000000123"),
      ).toMatchObject({
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
      message: "Please sign in to continue.",
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
        addSongsToPlaylist("00000000-0000-4000-8000-000000000123", ["song-1"]),
      ).resolves.toEqual(unauthorized);
      await expect(
        createNewPlaylist({ name: "Hacked Playlist" }),
      ).resolves.toEqual(unauthorized);
      await expect(
        renamePlaylist("00000000-0000-4000-8000-000000000123", {
          name: "Hacked Playlist",
        }),
      ).resolves.toEqual(unauthorized);
      await expect(
        deletePlaylist("00000000-0000-4000-8000-000000000123"),
      ).resolves.toEqual(unauthorized);
      await expect(
        removeSongsFromPlaylist(
          "00000000-0000-4000-8000-000000000123",
          0,
          "song-1",
        ),
      ).resolves.toEqual(unauthorized);
      await expect(updateUser({ name: "Attacker" })).resolves.toEqual(
        unauthorized,
      );
      await expect(deleteUser(MOCK_PASSWORD)).resolves.toEqual(unauthorized);
    });

    it("returns FORBIDDEN results for a foreign playlist", async () => {
      mockUser = { id: "user-123" };
      mockPlaylist = {
        id: "00000000-0000-4000-8000-0000000000bb",
        userId: "user-456",
        songs: ["existing-song"],
      };
      await expect(
        addSongsToPlaylist("00000000-0000-4000-8000-0000000000bb", [
          "attacker-song",
        ]),
      ).resolves.toEqual(forbidden);
      await expect(
        removeSongsFromPlaylist(
          "00000000-0000-4000-8000-0000000000bb",
          0,
          "existing-song",
        ),
      ).resolves.toEqual(forbidden);
      await expect(
        renamePlaylist("00000000-0000-4000-8000-0000000000bb", {
          name: "Stolen name",
        }),
      ).resolves.toEqual(forbidden);
      await expect(
        deletePlaylist("00000000-0000-4000-8000-0000000000bb"),
      ).resolves.toEqual(forbidden);
    });

    it("returns ok results carrying the data", async () => {
      mockUser = { id: "user-123" };
      mockPlaylist = {
        id: "00000000-0000-4000-8000-0000000000aa",
        userId: "user-123",
        songs: ["existing-song"],
      };
      expect(
        await addSongsToPlaylist("00000000-0000-4000-8000-0000000000aa", [
          "new-song",
        ]),
      ).toMatchObject({ ok: true });
      expect(
        await addSongsToPlaylist("00000000-0000-4000-8000-0000000000aa", [
          "new-song",
        ]),
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
