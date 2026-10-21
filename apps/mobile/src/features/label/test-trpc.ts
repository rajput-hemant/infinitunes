/** `~/lib/trpc` for the label screen's tests (see `features/artist/test-trpc`). */
import {
  fakeProcedure,
  trpc as base,
  trpcClient as baseClient,
} from "~/features/artist/test-trpc";

export const labelAnswer = jest.fn<Promise<unknown>, [input: unknown]>();

const get = { label: fakeProcedure("get.label", labelAnswer) };

export const trpc = { ...base, get };
export const trpcClient = { ...baseClient, get };
