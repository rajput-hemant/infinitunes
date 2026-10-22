import Constants from "expo-constants";
import { router } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import { useColorScheme } from "react-native";

import type { SymbolName } from "~/components/ui/icon";
import { authClient } from "~/lib/auth-client";
import { env } from "~/lib/env";
import { usePreferences } from "~/lib/preferences";
import {
  appearanceStore,
  useAccent,
  useAppearanceMode,
  useCornerStyle,
} from "~/theme/appearance";
import { accentColors } from "~/theme/tokens";

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

/** The tile colours of iOS's row icons (`ROW_TINT` resolves them to system colours). */
export type RowTint =
  | "blue"
  | "gray"
  | "green"
  | "indigo"
  | "orange"
  | "pink"
  | "red"
  | "teal";

type RowSymbol = Exclude<SymbolName, string>;

type RowBase = {
  id: string;
  label: string;
  /** An SF Symbol (iOS) and a Material Symbol (Android). */
  icon: RowSymbol;
  /** iOS: the icon tile's colour. */
  tint: RowTint;
  /** The accent's own colour, which replaces the default icon colour. */
  color?: string;
};

type SessionUser = NonNullable<
  ReturnType<typeof authClient.useSession>["data"]
>["user"];

export type SettingsRow =
  | { kind: "profile"; id: string; user: SessionUser }
  /** Opens another screen (chevron). */
  | (RowBase & { kind: "navigate"; detail?: string; onPress: () => void })
  /** Does something now (no chevron): sign out, clear, open a web page. */
  | (RowBase & {
      kind: "action";
      destructive?: boolean;
      onPress: () => void;
    })
  | (RowBase & {
      kind: "pick";
      value: string;
      options: readonly { label: string; value: string }[];
      onChange: (value: string) => void;
    })
  | (RowBase & {
      kind: "switch";
      value: boolean;
      onChange: (value: boolean) => void;
    })
  | (RowBase & { kind: "value"; value: string });

export type SettingsSection = {
  title: string;
  rows: readonly SettingsRow[];
};

/** A picker row; the generic keeps each list's option and handler types in step. */
function pick<Value extends string>(
  row: RowBase & {
    value: Value;
    options: readonly { label: string; value: Value }[];
    onChange: (value: Value) => void;
  },
): SettingsRow {
  // The renderer hands back one of `options`' own values.
  return {
    kind: "pick",
    ...row,
    onChange: row.onChange as (v: string) => void,
  };
}

/**
 * The settings, once for both platforms: sections, labels, icons, handlers and
 * which rows open a screen. `settings-screen` (iOS) and `settings-screen.android`
 * only decide how a row looks.
 */
export function useSettingsSections(): SettingsSection[] {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const appearance = useAppearanceMode();
  const accent = useAccent();
  const corners = useCornerStyle();
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const accentSwatch = accentColors(accent, scheme)?.primary;
  const streamQuality = usePreferences((p) => p.streamQuality);
  const downloadQuality = usePreferences((p) => p.downloadQuality);
  const setStreamQuality = usePreferences((p) => p.setStreamQuality);
  const setDownloadQuality = usePreferences((p) => p.setDownloadQuality);
  const imageQuality = usePreferences((p) => p.imageQuality);
  const setImageQuality = usePreferences((p) => p.setImageQuality);
  const languages = usePreferences((p) => p.languages);
  const cache = useSongCacheSettings();

  const account: SettingsSection = {
    title: "Account",
    rows: user
      ? [
          { kind: "profile", id: "profile", user },
          {
            kind: "navigate",
            id: "edit-profile",
            label: "Edit profile",
            icon: { ios: "person.crop.circle.fill", android: "person" },
            tint: "blue",
            onPress: () => router.push("/profile"),
          },
          {
            kind: "navigate",
            id: "change-password",
            label: "Change password",
            icon: { ios: "lock.fill", android: "lock" },
            tint: "gray",
            onPress: () => router.push("/password"),
          },
          {
            kind: "action",
            id: "sign-out",
            label: "Sign out",
            icon: {
              ios: "rectangle.portrait.and.arrow.right",
              android: "logout",
            },
            tint: "red",
            destructive: true,
            onPress: () => void signOut(),
          },
        ]
      : [
          {
            kind: "navigate",
            id: "sign-in",
            label: "Sign in to continue",
            detail: "Sign in to edit your profile and change your password.",
            icon: { ios: "person.crop.circle.fill", android: "account_circle" },
            tint: "blue",
            onPress: () => router.push("/login"),
          },
        ],
  };

  const appearanceSection: SettingsSection = {
    title: "Appearance",
    rows: [
      pick({
        id: "theme",
        label: "Theme",
        icon: { ios: "circle.lefthalf.filled", android: "contrast" },
        tint: "indigo",
        value: appearance,
        options: appearanceOptions,
        onChange: appearanceStore.getState().setMode,
      }),
      pick({
        id: "accent",
        label: "Accent color",
        icon: { ios: "paintpalette.fill", android: "palette" },
        tint: "gray",
        color: accentSwatch,
        value: accent,
        options: accentOptions,
        onChange: appearanceStore.getState().setAccent,
      }),
      pick({
        id: "corners",
        label: "Corners",
        icon: { ios: "app.fill", android: "rounded_corner" },
        tint: "gray",
        value: corners,
        options: cornerOptions,
        onChange: appearanceStore.getState().setCorners,
      }),
    ],
  };

  const playback: SettingsSection = {
    title: "Playback",
    rows: [
      pick({
        id: "stream-quality",
        label: "Stream quality",
        icon: { ios: "waveform", android: "graphic_eq" },
        tint: "pink",
        value: streamQuality,
        options: qualityOptions,
        onChange: setStreamQuality,
      }),
      pick({
        id: "download-quality",
        label: "Download quality",
        icon: { ios: "arrow.down.circle.fill", android: "download" },
        tint: "teal",
        value: downloadQuality,
        options: qualityOptions,
        onChange: setDownloadQuality,
      }),
      pick({
        id: "image-quality",
        label: "Image quality",
        icon: { ios: "photo.fill", android: "image" },
        tint: "orange",
        value: imageQuality,
        options: imageQualityOptions,
        onChange: setImageQuality,
      }),
      {
        kind: "navigate",
        id: "languages",
        label: "Languages",
        detail: languagesSummary(languages),
        icon: { ios: "globe", android: "language" },
        tint: "blue",
        onPress: () => router.push("/languages"),
      },
    ],
  };

  const storage: SettingsSection = {
    title: "Storage",
    rows: [
      {
        kind: "switch",
        id: "cache-songs",
        label: "Cache frequently played songs",
        icon: { ios: "arrow.down.circle.fill", android: "download" },
        tint: "teal",
        value: cache.enabled,
        onChange: cache.setEnabled,
      },
      {
        kind: "value",
        id: "cached-songs",
        label: "Cached songs",
        icon: { ios: "internaldrive.fill", android: "storage" },
        tint: "gray",
        value: cache.size,
      },
      {
        kind: "action",
        id: "clear-cache",
        label: "Clear cache",
        icon: { ios: "trash.fill", android: "delete" },
        tint: "red",
        destructive: true,
        onPress: cache.clear,
      },
    ],
  };

  const security: SettingsSection[] = user
    ? [
        {
          title: "Security",
          rows: [
            {
              kind: "navigate",
              id: "delete-account",
              label: "Delete account",
              icon: { ios: "trash.fill", android: "delete" },
              tint: "red",
              onPress: () => router.push("/delete-account"),
            },
          ],
        },
      ]
    : [];

  const about: SettingsSection = {
    title: "About",
    rows: [
      {
        kind: "action",
        id: "privacy",
        label: "Privacy policy",
        icon: { ios: "hand.raised.fill", android: "privacy_tip" },
        tint: "green",
        onPress: () => void openBrowserAsync(`${env.apiUrl}/privacy`),
      },
      {
        kind: "action",
        id: "terms",
        label: "Terms of service",
        icon: { ios: "doc.text.fill", android: "description" },
        tint: "gray",
        onPress: () => void openBrowserAsync(`${env.apiUrl}/terms`),
      },
      {
        kind: "value",
        id: "version",
        label: "Version",
        icon: { ios: "info.circle.fill", android: "info" },
        tint: "gray",
        value: Constants.expoConfig?.version ?? "",
      },
    ],
  };

  return [account, appearanceSection, playback, storage, ...security, about];
}
