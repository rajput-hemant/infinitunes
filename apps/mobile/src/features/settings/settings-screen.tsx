import { FieldGroup, Host } from "@expo/ui";
import { View } from "react-native";

import { playerDockInset } from "~/navigation/player-dock";
import { sizes } from "~/theme/tokens";

import { ProfileHeader } from "./profile-header";
import { PickerRow, SwitchRow, ValueRow } from "./selection-rows";
import type { SettingsRow } from "./settings-sections";
import { useSettingsSections } from "./settings-sections";
import { ROW_TINT } from "./tap-row-props";
import { ActionRow, NavigationRow } from "./tap-rows";

/** The row's iOS icon tile: its SF Symbol on the tint, or on the accent's own colour. */
function iconOf(row: Exclude<SettingsRow, { kind: "profile" }>) {
  return row.icon.ios
    ? { name: row.icon.ios, color: row.color ?? ROW_TINT[row.tint] }
    : undefined;
}

function Row({ row }: { row: SettingsRow }) {
  switch (row.kind) {
    case "profile":
      return <ProfileHeader user={row.user} />;
    case "navigate":
      return (
        <NavigationRow
          label={row.label}
          detail={row.detail}
          icon={iconOf(row)}
          onPress={row.onPress}
        />
      );
    case "action":
      return (
        <ActionRow
          label={row.label}
          icon={iconOf(row)}
          destructive={row.destructive}
          onPress={row.onPress}
        />
      );
    case "pick":
      return (
        <PickerRow
          label={row.label}
          icon={iconOf(row)}
          value={row.value}
          options={row.options}
          onChange={row.onChange}
        />
      );
    case "switch":
      return (
        <SwitchRow
          label={row.label}
          icon={iconOf(row)}
          value={row.value}
          onChange={row.onChange}
        />
      );
    case "value":
      return (
        <ValueRow label={row.label} icon={iconOf(row)} value={row.value} />
      );
  }
}

/**
 * Every setting on one native grouped list (a SwiftUI `Form`), like the web's
 * single settings page; the rows come from `useSettingsSections`. The list
 * scrolls itself, so it stops above the floating mini-player instead of
 * padding content: a view around the host takes the inset (a native host's own
 * padding need not shrink its SwiftUI root). With the iOS 26 tab bar accessory
 * the inset is 0. On a wide window the list is at most `sizes.readable` wide,
 * centred.
 */
export function SettingsScreen() {
  const sections = useSettingsSections();

  return (
    <View style={{ flex: 1, paddingBottom: playerDockInset }}>
      <Host
        style={{
          flex: 1,
          width: "100%",
          maxWidth: sizes.readable,
          alignSelf: "center",
        }}
      >
        <FieldGroup>
          {sections.map((section) => (
            <FieldGroup.Section key={section.title} title={section.title}>
              {section.rows.map((row) => (
                <Row key={row.id} row={row} />
              ))}
            </FieldGroup.Section>
          ))}
        </FieldGroup>
      </Host>
    </View>
  );
}
