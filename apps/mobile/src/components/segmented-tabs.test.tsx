import { screen } from "@testing-library/react-native";

import { renderWithProviders } from "~/test/render";

import { SegmentedTabs } from "./segmented-tabs";

type ControlProps = {
  values: string[];
  selectedIndex: number;
  onChange: (event: { nativeEvent: { selectedSegmentIndex: number } }) => void;
};

// The native control is opaque in Jest: stand in with a view keeping its props.
jest.mock("@expo/ui/community/segmented-control", () => {
  const { View } = require("react-native");
  return {
    SegmentedControl: (props: object) => <View {...props} testID="segments" />,
  };
});

const TABS = ["overview", "songs", "albums"] as const;
const LABELS = { overview: "Overview", songs: "Songs", albums: "Albums" };

function renderTabs(value: (typeof TABS)[number], onChange = jest.fn()) {
  return renderWithProviders(
    <SegmentedTabs
      tabs={TABS}
      labels={LABELS}
      value={value}
      onChange={onChange}
    />,
  ).then(() => ({
    onChange,
    control: () => screen.getByTestId("segments").props as ControlProps,
  }));
}

const choose = (control: ControlProps, selectedSegmentIndex: number) =>
  control.onChange({ nativeEvent: { selectedSegmentIndex } });

describe("SegmentedTabs (iOS)", () => {
  it("lists the labels and selects the current tab's index", async () => {
    const { control } = await renderTabs("songs");
    expect(control().values).toEqual(["Overview", "Songs", "Albums"]);
    expect(control().selectedIndex).toBe(1);
  });

  it("reports the tab behind the chosen segment", async () => {
    const { control, onChange } = await renderTabs("overview");
    choose(control(), 2);
    expect(onChange).toHaveBeenCalledWith("albums");
  });

  it("ignores an index outside the tab list", async () => {
    const { control, onChange } = await renderTabs("overview");
    choose(control(), 3);
    choose(control(), -1);
    expect(onChange).not.toHaveBeenCalled();
  });
});
