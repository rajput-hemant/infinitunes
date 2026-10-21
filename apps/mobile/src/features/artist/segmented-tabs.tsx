import { SegmentedControl } from "@expo/ui/community/segmented-control";
import { View } from "react-native";

type SegmentedTabsProps<Tab extends string> = {
  tabs: readonly Tab[];
  labels: Record<Tab, string>;
  value: Tab;
  onChange: (tab: Tab) => void;
  testID?: string;
};

/** The native segmented control (UISegmentedControl, Material segmented buttons) over a tab list. */
export function SegmentedTabs<Tab extends string>({
  tabs,
  labels,
  value,
  onChange,
  testID,
}: SegmentedTabsProps<Tab>) {
  return (
    <View className="w-full px-page">
      <SegmentedControl
        testID={testID}
        values={tabs.map((tab) => labels[tab])}
        selectedIndex={tabs.indexOf(value)}
        onChange={({ nativeEvent }) => {
          const tab = tabs[nativeEvent.selectedSegmentIndex];
          if (tab) onChange(tab);
        }}
        style={{ width: "100%" }}
      />
    </View>
  );
}
