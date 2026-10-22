import type { AppRouter } from "@infinitunes/trpc/types";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import { userPlaylist } from "./user-library";

/**
 * `~/lib/trpc` in every suite (`src/test/setup.ts` maps it here): each
 * procedure is one `jest.fn` (`procedure("album.details")`), which both the
 * query options (`trpc.album.details.queryOptions(input)`) and the imperative
 * client (`trpcClient.album.details.query(input)`, `.mutate(input)`) call.
 * The user-library procedures answer like an account with nothing saved and
 * account writes succeed; every other procedure rejects until a test sets its
 * answer with `mockResolvedValue`. Answers reset to those defaults before
 * each test (`src/test/setup-after-env.ts`).
 */

type Inputs = inferRouterInputs<AppRouter>;
type Outputs = inferRouterOutputs<AppRouter>;
type Router = keyof Outputs & string;

export type ProcedurePath = {
  [R in Router]: `${R}.${keyof Outputs[R] & string}`;
}[Router];

type InputOf<Path extends ProcedurePath> =
  Path extends `${infer R extends Router}.${infer P}`
    ? P extends keyof Inputs[R]
      ? Inputs[R][P]
      : never
    : never;

type OutputOf<Path extends ProcedurePath> =
  Path extends `${infer R extends Router}.${infer P}`
    ? P extends keyof Outputs[R]
      ? Outputs[R][P]
      : never
    : never;

export type MockProcedure<Path extends ProcedurePath> = jest.Mock<
  Promise<OutputOf<Path>>,
  [input: InputOf<Path>]
>;

type Defaults = {
  [Path in ProcedurePath]?: () => Promise<OutputOf<Path>>;
};

const DEFAULTS: Defaults = {
  "user.getUserFavorites": async () => undefined,
  "user.getUserPlaylists": async () => [],
  "user.getPlaylistDetails": async () => undefined,
  "user.addToFavorites": async () => [],
  "user.removeFromFavorites": async () => [],
  "user.createNewPlaylist": async () => userPlaylist({ id: "pl-new" }),
  "user.addSongsToPlaylist": async () => userPlaylist(),
  "user.removeSongsFromPlaylist": async () => userPlaylist(),
  "user.renamePlaylist": async () => userPlaylist(),
  "user.deletePlaylist": async () => userPlaylist(),
  "user.updateUser": async () => undefined,
  "user.changePassword": async () => undefined,
  "user.deleteUser": async () => ({ id: "user-1" }),
  "history.list": async () => [],
  "history.record": async () => ({ ok: true }),
};

const defaults = new Map<string, () => Promise<unknown>>(
  Object.entries(DEFAULTS),
);

type AnyProcedure = jest.Mock<Promise<unknown>, [input: unknown]>;

const procedures = new Map<string, AnyProcedure>();

function defaultAnswer(path: string): (input: unknown) => Promise<unknown> {
  return (
    defaults.get(path) ??
    (async () => {
      throw new Error(`No answer set for ${path}`);
    })
  );
}

function mockAt(path: string): AnyProcedure {
  const found = procedures.get(path);
  if (found) return found;
  const created: AnyProcedure = jest.fn(defaultAnswer(path));
  procedures.set(path, created);
  return created;
}

/** The mocked procedure at `path`; script it with `mockResolvedValue` and friends. */
export function procedure<Path extends ProcedurePath>(
  path: Path,
): MockProcedure<Path> {
  return mockAt(path) as MockProcedure<Path>;
}

/** Restores every procedure's default answer and forgets its calls. */
export function resetProcedures() {
  for (const [path, mock] of procedures) {
    mock.mockReset();
    mock.mockImplementation(defaultAnswer(path));
  }
}

/** What a rejected tRPC call looks like to `errorCode`/`userMessage`. */
export function trpcError(code: string, message = code) {
  return Object.assign(new Error(message), { data: { code } });
}

function queryKey(path: string[], input: unknown) {
  return [
    path,
    input === undefined ? { type: "query" } : { input, type: "query" },
  ];
}

/** A router or procedure of the options proxy (`trpc`), at `path`. */
function optionsNode(path: string[]): object {
  const node = {
    pathKey: () => [path],
    queryKey: (input?: unknown) => queryKey(path, input),
    queryOptions: (input?: unknown) => ({
      queryKey: queryKey(path, input),
      queryFn: () => mockAt(path.join("."))(input),
    }),
  };
  return new Proxy(node, {
    get: (target, key) =>
      typeof key === "string" && !(key in target)
        ? optionsNode([...path, key])
        : Reflect.get(target, key),
  });
}

/** A router or procedure of the vanilla client (`trpcClient`), at `path`. */
function clientNode(path: string[]): object {
  return new Proxy(
    {},
    {
      get: (_target, key) => {
        if (typeof key !== "string") return undefined;
        if (key === "query" || key === "mutate") return mockAt(path.join("."));
        return clientNode([...path, key]);
      },
    },
  );
}

export const trpc = optionsNode([]);
export const trpcClient = clientNode([]);
