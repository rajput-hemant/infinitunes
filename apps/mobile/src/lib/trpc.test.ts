import { signInAs } from "~/test/session-mock";

jest.mock("superjson", () => ({
  __esModule: true,
  default: {
    serialize: (json: unknown) => ({ json }),
    deserialize: ({ json }: { json: unknown }) => json,
  },
}));

const { trpcClient } = jest.requireActual<typeof import("./trpc")>("./trpc");

afterEach(() => jest.restoreAllMocks());

it("splits large native query batches into URLs at most 2083 characters long", async () => {
  signInAs("alice");
  const requests: string[] = [];
  const transport = jest
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (input) => {
      const url = String(input);
      requests.push(url);
      const count = new URL(url).pathname.split("/").at(-1)!.split(",").length;
      return new Response(
        JSON.stringify(
          Array.from({ length: count }, () => ({
            result: { data: { json: { songs: [] } } },
          })),
        ),
        { headers: { "content-type": "application/json" } },
      );
    });

  await Promise.all(
    Array.from({ length: 20 }, (_, chunk) =>
      trpcClient.song.details.query({
        id: Array.from({ length: 25 }, (_song, i) => `song-${chunk}-${i}`).join(
          ",",
        ),
      }),
    ),
  );

  expect(requests.length).toBeGreaterThan(1);
  expect(requests.every((url) => url.length <= 2083)).toBe(true);
  for (const [, options] of transport.mock.calls) {
    expect(options).toMatchObject({
      credentials: "omit",
      headers: {
        "expo-origin": "infinitunes://",
        cookie: "infinitunes.session_token=test",
      },
    });
  }
});

it("sends the home feed on its own request so it never waits for a slower query", async () => {
  signInAs("alice");
  const requests: string[] = [];
  jest.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    requests.push(url);
    const { pathname, searchParams } = new URL(url);
    const count = pathname.split("/").at(-1)!.split(",").length;
    const result = { result: { data: { json: {} } } };
    return new Response(
      JSON.stringify(
        searchParams.has("batch")
          ? Array.from({ length: count }, () => result)
          : result,
      ),
      { headers: { "content-type": "application/json" } },
    );
  });

  await Promise.all([
    trpcClient.home.home.query({}),
    trpcClient.search.top.query(),
    trpcClient.get.featuredStations.query({ page: 1, n: 20 }),
  ]);

  const paths = requests.map((url) => new URL(url).pathname.split("/").at(-1));
  expect(paths).toContain("home.home");
  expect(paths.filter((path) => path?.includes("home.home"))).toHaveLength(1);
});
