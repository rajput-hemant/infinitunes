import { View } from "react-native";

import { cx } from "~/lib/class-names";

import { NativeMenu } from "./native-menu";
import { Icon } from "./ui/icon";
import { Text } from "./ui/text";

type Option<Id extends string> = { id: Id; title: string };

/**
 * Every trigger is the full touch height: the native menu hit-tests its
 * child's bounds, so slop cannot reach it. What is drawn sits inside.
 */
const TRIGGERS = {
  /** A tinted 40pt pill centred in the 48pt target, for controls in a row (a show's season and order). */
  pill: {
    className: "min-h-ctl gap-1 rounded-full bg-secondary px-3 py-1",
    tone: "onSecondary",
  },
  /** Plain muted text, for a list's sort order beside its count. */
  plain: { className: "gap-1", tone: "muted" },
} as const;

type OptionMenuProps<Id extends string> = {
  /** Names the choice: the menu's title and the trigger's label ("Season"). */
  label: string;
  options: readonly Option<Id>[];
  selectedId: Id;
  onSelect: (id: Id) => void;
  variant?: keyof typeof TRIGGERS;
  testID?: string;
};

/** A one-of-many choice in the platform menu; its trigger shows the current option. */
export function OptionMenu<Id extends string>({
  label,
  options,
  selectedId,
  onSelect,
  variant = "pill",
  testID,
}: OptionMenuProps<Id>) {
  const selected = options.find((option) => option.id === selectedId);
  const trigger = TRIGGERS[variant];

  return (
    <NativeMenu
      title={label}
      testID={testID}
      entries={options.map(({ id, title }) => ({
        id,
        title,
        state: id === selectedId ? "on" : "off",
        run: () => onSelect(id),
      }))}
    >
      <View
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${selected?.title ?? ""}`}
        className="min-h-touch justify-center"
      >
        <View className={cx("flex-row items-center", trigger.className)}>
          <Text variant="subhead" tone={trigger.tone}>
            {selected?.title ?? label}
          </Text>
          <Icon
            name={{ ios: "chevron.up.chevron.down", android: "unfold_more" }}
            size="xs"
          />
        </View>
      </View>
    </NativeMenu>
  );
}
