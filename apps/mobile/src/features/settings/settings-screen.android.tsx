import type { ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  Switch,
  useWindowDimensions,
  View,
} from "react-native";

import { NativeMenu } from "~/components/native-menu";
import { Icon } from "~/components/ui/icon";
import type { SymbolName } from "~/components/ui/icon";
import { Text } from "~/components/ui/text";
import { toggle } from "~/lib/haptics";
import { userInitial } from "~/lib/user-initial";
import { playerDockInset } from "~/navigation/player-dock";
import { sizes, space } from "~/theme/tokens";
import { usePalette } from "~/theme/use-palette";

import { useSettingsSections } from "./settings-sections";
import type { SettingsRow } from "./settings-sections";

type Option<Value extends string> = { label: string; value: Value };

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-2 pt-4">
      <Text variant="label" tone="primary" className="px-6">
        {title}
      </Text>
      {/* Android 16's segmented list: each row its own tile, 2dp seams, large outer corners. */}
      <View
        className="mx-page overflow-hidden rounded-lg"
        style={{ gap: sizes.seam }}
      >
        {children}
      </View>
    </View>
  );
}

/** Android 16 Settings' leading icon: the bare 24dp symbol in onSurfaceVariant. */
function Leading({ icon, color }: { icon: SymbolName; color?: string }) {
  const palette = usePalette();
  return (
    <Icon name={icon} size="lg" color={color ?? palette["muted-foreground"]} />
  );
}

function RowFace({
  icon,
  iconColor,
  title,
  detail,
  value,
  trailing,
  destructive = false,
  width,
}: {
  /** A menu host sizes to its content, so its row is given the card width. */
  width?: number;
  icon: SymbolName;
  iconColor?: string;
  title: string;
  detail?: string;
  value?: string;
  trailing?: SymbolName | null;
  destructive?: boolean;
}) {
  const palette = usePalette();
  return (
    <View
      className="min-h-row flex-row items-center gap-4 rounded-xs bg-card px-4 py-2"
      style={[
        width ? { width } : null,
        detail || value ? { minHeight: sizes["row-2"] } : null,
      ]}
    >
      <Leading
        icon={icon}
        color={destructive ? palette.destructive : iconColor}
      />
      <View className="flex-1">
        <Text tone={destructive ? "error" : "default"}>{title}</Text>
        {/* The current value is the supporting text, as in Android's Settings. */}
        {detail || value ? (
          <Text variant="subhead" tone="muted">
            {detail ?? value}
          </Text>
        ) : null}
      </View>
      {trailing ? (
        <Icon name={trailing} size="md" color={palette["muted-foreground"]} />
      ) : null}
    </View>
  );
}

function TapRow(
  props: Parameters<typeof RowFace>[0] & {
    onPress: () => void;
    /** Does something here (sign out, clear): no chevron, which means "opens". */
    action?: boolean;
  },
) {
  const { onPress, action = false, ...face } = props;
  const ripple = usePalette()["fill-2"];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[props.title, props.detail]
        .filter(Boolean)
        .join(", ")}
      android_ripple={{ color: ripple, foreground: true }}
    >
      <RowFace
        {...face}
        trailing={
          action
            ? null
            : (face.trailing ?? {
                ios: "chevron.forward",
                android: "chevron_right",
              })
        }
      />
    </Pressable>
  );
}

function PickRow<Value extends string>({
  icon,
  iconColor,
  title,
  value,
  options,
  onChange,
}: {
  icon: SymbolName;
  iconColor?: string;
  title: string;
  value: Value;
  options: readonly Option<Value>[];
  onChange: (value: Value) => void;
}) {
  const current = options.find((option) => option.value === value);
  const { width } = useWindowDimensions();
  return (
    <NativeMenu
      title={title}
      entries={options.map((option) => ({
        id: option.value,
        title: option.label,
        state: option.value === value ? "on" : "off",
        run: () => onChange(option.value),
      }))}
    >
      <View
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${current?.label ?? ""}`}
      >
        <RowFace
          width={Math.min(width, sizes.readable) - 2 * sizes.page}
          icon={icon}
          iconColor={iconColor}
          title={title}
          value={current?.label}
        />
      </View>
    </NativeMenu>
  );
}

function ProfileCard({ name, email }: { name?: string | null; email: string }) {
  return (
    <View
      testID="profile"
      className="min-h-row flex-row items-center gap-4 rounded-xs bg-card px-4 py-3"
    >
      <View className="size-ctl items-center justify-center rounded-full bg-primary">
        <Text variant="title2" tone="onPrimary">
          {userInitial({ name, email })}
        </Text>
      </View>
      <View className="flex-1">
        <Text variant="headline" numberOfLines={1}>
          {name?.trim() || email}
        </Text>
        {name?.trim() ? (
          <Text variant="subhead" tone="muted" numberOfLines={1}>
            {email}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function SwitchRow({
  icon,
  title,
  value,
  onChange,
}: {
  icon: SymbolName;
  title: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View className="flex-row items-center rounded-xs bg-card">
      <View className="flex-1">
        <RowFace icon={icon} title={title} />
      </View>
      <Switch
        accessibilityLabel={title}
        value={value}
        onValueChange={(next) => {
          toggle(next);
          onChange(next);
        }}
        style={{ minHeight: sizes.touch, marginRight: sizes.page }}
      />
    </View>
  );
}

function Row({ row }: { row: SettingsRow }) {
  switch (row.kind) {
    case "profile":
      return <ProfileCard name={row.user.name} email={row.user.email} />;
    case "navigate":
      return (
        <TapRow
          icon={row.icon}
          title={row.label}
          detail={row.detail}
          onPress={row.onPress}
        />
      );
    case "action":
      return (
        <TapRow
          icon={row.icon}
          title={row.label}
          destructive={row.destructive}
          action
          onPress={row.onPress}
        />
      );
    case "pick":
      return (
        <PickRow
          icon={row.icon}
          iconColor={row.color}
          title={row.label}
          value={row.value}
          options={row.options}
          onChange={row.onChange}
        />
      );
    case "switch":
      return (
        <SwitchRow
          icon={row.icon}
          title={row.label}
          value={row.value}
          onChange={row.onChange}
        />
      );
    case "value":
      return <RowFace icon={row.icon} title={row.label} value={row.value} />;
  }
}

/**
 * Settings as Material 3 Expressive's segmented list: 56dp tiles (72dp with
 * a value) with a bare leading icon, the title over its value, and a chevron
 * where a row opens a screen; only the profile card has a filled circle. Not
 * the form fields the shared native list renders on iOS. The rows come from
 * `useSettingsSections`. On a wide window the list is at most `sizes.readable`
 * wide, centred.
 */
export function SettingsScreen() {
  const sections = useSettingsSections();

  return (
    <ScrollView
      contentContainerClassName="w-full max-w-readable self-center"
      contentContainerStyle={{ paddingBottom: playerDockInset + space.xl }}
    >
      {sections.map((section) => (
        <Section key={section.title} title={section.title}>
          {section.rows.map((row) => (
            <Row key={row.id} row={row} />
          ))}
        </Section>
      ))}
    </ScrollView>
  );
}
