import {
  trpc as libraryTrpc,
  trpcClient as libraryClient,
} from "~/test/trpc-mock";

/**
 * `~/lib/trpc` for the account tests (`jest.mock("~/lib/trpc", () =>
 * require("~/features/settings/trpc-mock"))`): the shared mock's library
 * procedures, plus the account mutations as `jest.fn`s answering success and
 * the real shape of the `user` path key (`pathKey()` is a prefix of every
 * `user.*` query key).
 */

const succeed = async (..._input: unknown[]) => ({});

export const trpc = {
  user: { ...libraryTrpc.user, pathKey: () => [["user"]] },
};

export const trpcClient = {
  user: {
    ...libraryClient.user,
    updateUser: { mutate: jest.fn(succeed) },
    changePassword: { mutate: jest.fn(succeed) },
    deleteUser: { mutate: jest.fn(succeed) },
  },
};

/** What a rejected tRPC call looks like to `userMessage`. */
export function trpcError(message: string, code: string) {
  return Object.assign(new Error(message), { data: { code } });
}
