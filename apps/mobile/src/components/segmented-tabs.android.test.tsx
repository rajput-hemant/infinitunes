import { fireEvent, screen } from "@testing-library/react-native";

import { renderScreen } from "~/test/render";

// Named in full: Jest resolves the iOS module by default.
import { SegmentedTabs } from "./segmented-tabs.android";

const TABS = ["overview", "songs"] as const;
const LABELS = { overview: "Overview", songs: "Songs" };

describe("SegmentedTabs (Android connected button group)", () => {
  it("is one tab per segment, each the 48dp target itself", async () => {
    const onChange = jest.fn();
    await renderScreen(
      <SegmentedTabs
        tabs={TABS}
        labels={LABELS}
        value="overview"
        onChange={onChange}
      />,
    );

    const songs = screen.getByRole("tab", { name: "Songs" });
    expect(screen.getByRole("tab", { name: "Overview" })).toBeSelected();
    // The slop sits on the clipped segment, so Android hit-tests it.
    expect(songs).toHaveProp("hitSlop", { top: 4, bottom: 4 });
    await fireEvent.press(songs);
    expect(onChange).toHaveBeenCalledWith("songs");
  });
});
