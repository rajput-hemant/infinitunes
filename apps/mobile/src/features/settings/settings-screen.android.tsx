import Constants from "expo-constants";
import { router } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import type { ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  Switch,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";

import { NativeMenu } from "~/components/native-menu";
import { Icon } from "~/components/ui/icon";
import type { SymbolName } from "~/components/ui/icon";
import { Text } from "~/components/ui/text";
import { authClient } from "~/lib/auth-client";
import { env } from "~/lib/env";
import { usePreferences } from "~/lib/preferences";
import { userInitial } from "~/lib/user-initial";
import { playerDockInset } from "~/navigation/player-dock";
import {
  appearanceStore,
  useAccent,
  useAppearanceMode,
  useCornerStyle,
} from "~/theme/appearance";
import { accentColors, sizes } from "~/theme/tokens";
import { usePalette } from "~/theme/use-palette";

import { signOut } from "./end-session";
import { languagesSummary } from "./languages-screen";
import {
  accentOptions,
  appearanceOptions,
  cornerOptions,
  imageQualityOptions,
  qualityOptions,
} from "./settings-options";
import { useSongCacheSettings } from "./use-song-cache-settings";

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
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[props.title, props.detail]
        .filter(Boolean)
        .join(", ")}
      android_ripple={{ color: "rgba(127,127,127,0.2)", foreground: true }}
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
          width={width - 2 * sizes.page}
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

/**
 * Settings as Material 3 Expressive's segmented list: 56dp tiles (72dp with
 * a value) with a bare leading icon, the title over its value, and a chevron
 * where a row opens a screen; only the profile card has a filled circle. Not
 * the form fields the shared native list renders on Android.
 */
export function SettingsScreen() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const appearance = useAppearanceMode();
  const accent = useAccent();
  const corners = useCornerStyle();
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const swatch = accentColors(accent, scheme)?.primary;
  const streamQuality = usePreferences((p) => p.streamQuality);
  const downloadQuality = usePreferences((p) => p.downloadQuality);
  const setStreamQuality = usePreferences((p) => p.setStreamQuality);
  const setDownloadQuality = usePreferences((p) => p.setDownloadQuality);
  const imageQuality = usePreferences((p) => p.imageQuality);
  const setImageQuality = usePreferences((p) => p.setImageQuality);
  const languages = usePreferences((p) => p.languages);
  const cache = useSongCacheSettings();

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: playerDockInset + 24 }}>
      <Section title="Account">
        {user ? (
          <>
            <ProfileCard name={user.name} email={user.email} />
            <TapRow
              icon={{ ios: "person.crop.circle", android: "person" }}
              title="Edit profile"
              onPress={() => router.push("/profile")}
            />
            <TapRow
              icon={{ ios: "lock.fill", android: "lock" }}
              title="Change password"
              onPress={() => router.push("/password")}
            />
            <TapRow
              icon={{
                ios: "rectangle.portrait.and.arrow.right",
                android: "logout",
              }}
              title="Sign out"
              destructive
              action
              onPress={() => void signOut()}
            />
          </>
        ) : (
          <TapRow
            icon={{ ios: "person.crop.circle", android: "account_circle" }}
            title="Sign in to continue"
            detail="Sign in to edit your profile and change your password."
            onPress={() => router.push("/login")}
          />
        )}
      </Section>

      <Section title="Appearance">
        <PickRow
          icon={{ ios: "circle.lefthalf.filled", android: "contrast" }}
          title="Theme"
          value={appearance}
          options={appearanceOptions}
          onChange={appearanceStore.getState().setMode}
        />
        <PickRow
          icon={{ ios: "paintpalette.fill", android: "palette" }}
          iconColor={swatch}
          title="Accent color"
          value={accent}
          options={accentOptions}
          onChange={appearanceStore.getState().setAccent}
        />
        <PickRow
          icon={{ ios: "app.fill", android: "rounded_corner" }}
          title="Corners"
          value={corners}
          options={cornerOptions}
          onChange={appearanceStore.getState().setCorners}
        />
      </Section>

      <Section title="Playback">
        <PickRow
          icon={{ ios: "waveform", android: "graphic_eq" }}
          title="Stream quality"
          value={streamQuality}
          options={qualityOptions}
          onChange={setStreamQuality}
        />
        <PickRow
          icon={{ ios: "arrow.down.circle.fill", android: "download" }}
          title="Download quality"
          value={downloadQuality}
          options={qualityOptions}
          onChange={setDownloadQuality}
        />
        <PickRow
          icon={{ ios: "photo.fill", android: "image" }}
          title="Image quality"
          value={imageQuality}
          options={imageQualityOptions}
          onChange={setImageQuality}
        />
        <TapRow
          icon={{ ios: "globe", android: "language" }}
          title="Languages"
          detail={languagesSummary(languages)}
          onPress={() => router.push("/languages")}
        />
      </Section>

      <Section title="Storage">
        <View className="flex-row items-center rounded-xs bg-card">
          <View className="flex-1">
            <RowFace
              icon={{ ios: "arrow.down.circle.fill", android: "download" }}
              title="Cache frequently played songs"
            />
          </View>
          <Switch
            accessibilityLabel="Cache frequently played songs"
            value={cache.enabled}
            onValueChange={cache.setEnabled}
            style={{ minHeight: sizes.touch, marginRight: sizes.page }}
          />
        </View>
        <RowFace
          icon={{ ios: "internaldrive.fill", android: "storage" }}
          title="Cached songs"
          value={cache.size}
        />
        <TapRow
          icon={{ ios: "trash.fill", android: "delete" }}
          title="Clear cache"
          destructive
          action
          onPress={cache.clear}
        />
      </Section>

      {user ? (
        <Section title="Security">
          <TapRow
            icon={{ ios: "trash.fill", android: "delete" }}
            title="Delete account"
            destructive
            onPress={() => router.push("/delete-account")}
          />
        </Section>
      ) : null}

      <Section title="About">
        <TapRow
          icon={{ ios: "hand.raised.fill", android: "privacy_tip" }}
          title="Privacy policy"
          onPress={() => void openBrowserAsync(`${env.apiUrl}/privacy`)}
        />
        <TapRow
          icon={{ ios: "doc.text.fill", android: "description" }}
          title="Terms of service"
          onPress={() => void openBrowserAsync(`${env.apiUrl}/terms`)}
        />
        <RowFace
          icon={{ ios: "info.circle.fill", android: "info" }}
          title="Version"
          value={Constants.expoConfig?.version ?? ""}
        />
      </Section>
    </ScrollView>
  );
}
