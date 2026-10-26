import { screen } from "@testing-library/react-native";

import { renderScreen } from "~/test/render";

import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";

const icon = { ios: "music.note.list", android: "queue_music" } as const;

function liveRegionAbove(node: { parent: unknown } | null) {
  let current = node as {
    props: { accessibilityLiveRegion?: string };
    parent: unknown;
  } | null;
  while (current && current.props.accessibilityLiveRegion === undefined) {
    current = current.parent as typeof current;
  }
  return current?.props.accessibilityLiveRegion;
}

describe("EmptyState", () => {
  it("marks its title as a heading so a screen reader can jump to it", async () => {
    await renderScreen(<EmptyState icon={icon} title="No playlists yet" />);

    expect(
      screen.getByRole("header", { name: "No playlists yet" }),
    ).toBeTruthy();
  });

  it("does not announce itself unless it is a failure", async () => {
    await renderScreen(<EmptyState icon={icon} title="Nothing here" />);

    expect(liveRegionAbove(screen.getByRole("header"))).toBeUndefined();
  });
});

describe("ErrorState", () => {
  it("announces the failure politely when it replaces content", async () => {
    await renderScreen(
      <ErrorState error={new Error("x")} onRetry={jest.fn()} />,
    );

    expect(
      liveRegionAbove(
        screen.getByRole("header", { name: "Couldn't load this" }),
      ),
    ).toBe("polite");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
