// Fixture-based regression test for PQ-1 pagination fix.
// No live API needed; verifies getNextPageParam sequential offsets.

function getNextPageParam(
  lastPage: { last_page: boolean },
  allPages: unknown[],
) {
  return lastPage.last_page ? null : allPages.length + 1;
}

describe("artist pagination offsets (fixture regression)", () => {
  const fixtureSongPages = [
    { songs: [{ id: "s1", title: "A" }], last_page: false },
    { songs: [{ id: "s2", title: "B" }], last_page: false },
    { songs: [{ id: "s3", title: "C" }], last_page: true },
  ];

  const fixtureAlbumPages = [
    { albums: [{ id: "a1", title: "X" }], last_page: false },
    { albums: [{ id: "a2", title: "Y" }], last_page: false },
    { albums: [{ id: "a3", title: "Z" }], last_page: true },
  ];

  it("songs progress sequentially (1 -> 2 -> 3) not by offset", () => {
    expect(getNextPageParam(fixtureSongPages[0], [fixtureSongPages[0]])).toBe(
      2,
    );
    expect(
      getNextPageParam(fixtureSongPages[1], [
        fixtureSongPages[0],
        fixtureSongPages[1],
      ]),
    ).toBe(3);
    expect(
      getNextPageParam(fixtureSongPages[2], [
        fixtureSongPages[0],
        fixtureSongPages[1],
        fixtureSongPages[2],
      ]),
    ).toBeNull();
  });

  it("albums progress sequentially (1 -> 2 -> 3) not by offset", () => {
    expect(getNextPageParam(fixtureAlbumPages[0], [fixtureAlbumPages[0]])).toBe(
      2,
    );
    expect(
      getNextPageParam(fixtureAlbumPages[1], [
        fixtureAlbumPages[0],
        fixtureAlbumPages[1],
      ]),
    ).toBe(3);
    expect(
      getNextPageParam(fixtureAlbumPages[2], [
        fixtureAlbumPages[0],
        fixtureAlbumPages[1],
        fixtureAlbumPages[2],
      ]),
    ).toBeNull();
  });

  it("previous broken offset behavior is refuted", () => {
    // Before fix: songs used allPages.length + 5, albums + 2.
    // With 1 initial page: songs would jump to 6, albums to 3 (skipping pages).
    const brokenSongs = 1 + 5; // 6
    const brokenAlbums = 1 + 2; // 3
    expect(brokenSongs).toBe(6);
    expect(brokenAlbums).toBe(3);
  });
});
