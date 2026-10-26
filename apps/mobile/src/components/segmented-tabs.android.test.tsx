import { fireEvent, screen } from "@testing-library/react-native";

import { selection } from "~/lib/haptics";
import { renderScreen } from "~/test/render";

// Named in full: Jest resolves the iOS module by default.
import { SegmentedTabs } from "./segmented-tabs.android";

jest.mock("~/lib/haptics");

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
    expect(selection).toHaveBeenCalledTimes(1);
    // The selected segment does not tick again.
    await fireEvent.press(screen.getByRole("tab", { name: "Overview" }));
    expect(selection).toHaveBeenCalledTimes(1);
  });
});
