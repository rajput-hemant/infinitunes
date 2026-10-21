/** `~/lib/trpc` for the show and episode screens' tests (see `features/artist/test-trpc`). */
import {
  fakeProcedure,
  trpc as base,
  trpcClient as baseClient,
} from "~/features/artist/test-trpc";

export const showAnswers = {
  details: jest.fn<Promise<unknown>, [input: unknown]>(),
  episodes: jest.fn<Promise<unknown>, [input: unknown]>(),
  episodeDetails: jest.fn<Promise<unknown>, [input: unknown]>(),
};

const show = {
  details: fakeProcedure("show.details", showAnswers.details),
  episodes: fakeProcedure("show.episodes", showAnswers.episodes),
  episodeDetails: fakeProcedure(
    "show.episodeDetails",
    showAnswers.episodeDetails,
  ),
};

export const trpc = { ...base, show };
export const trpcClient = { ...baseClient, show };
