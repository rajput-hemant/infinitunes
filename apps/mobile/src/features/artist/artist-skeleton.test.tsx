import { screen } from "@testing-library/react-native";

import { renderScreen } from "~/test/render";

import { ArtistSkeleton } from "./artist-skeleton";

it("uses navigation rows for the albums tab", async () => {
  await renderScreen(<ArtistSkeleton tab="albums" />);
  expect(screen.getAllByTestId("media-skeleton-row")).toHaveLength(5);
  expect(screen.queryByTestId("row-skeleton-menu")).toBeNull();
});
