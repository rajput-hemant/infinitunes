import { FieldGroup, Host } from "@expo/ui";
import Constants from "expo-constants";
import { router } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import { useColorScheme, View } from "react-native";

import { authClient } from "~/lib/auth-client";
import { env } from "~/lib/env";
import { usePreferences } from "~/lib/preferences";
import { playerDockInset } from "~/navigation/player-dock";
import {
  appearanceStore,
  useAccent,
  useAppearanceMode,
  useCornerStyle,
} from "~/theme/appearance";
import { accentColors } from "~/theme/tokens";

import { signOut } from "./end-session";
import { languagesSummary } from "./languages-screen";
import { ProfileHeader } from "./profile-header";
import { PickerRow, SwitchRow, ValueRow } from "./selection-rows";
import {
  accentOptions,
  appearanceOptions,
  cornerOptions,
  imageQualityOptions,
  qualityOptions,
} from "./settings-options";
import { ActionRow, NavigationRow } from "./tap-rows";
import { useSongCacheSettings } from "./use-song-cache-settings";

/**
 * Every setting on one native grouped list (a SwiftUI `Form`, a Material 3
 * list), like the web's single settings page. The list scrolls itself, so
 * it stops above the floating mini-player instead of padding content: a view
 * around the host takes the inset (a native host's own padding need not shrink
 * its SwiftUI root). With the iOS 26 tab bar accessory the inset is 0.
 */
export function SettingsScreen() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const appearance = useAppearanceMode();
  const accent = useAccent();
  const corners = useCornerStyle();
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const accentSwatch = accentColors(accent, scheme)?.primary ?? "#8E8E93";
  const streamQuality = usePreferences((p) => p.streamQuality);
  const downloadQuality = usePreferences((p) => p.downloadQuality);
  const setStreamQuality = usePreferences((p) => p.setStreamQuality);
  const setDownloadQuality = usePreferences((p) => p.setDownloadQuality);
  const imageQuality = usePreferences((p) => p.imageQuality);
  const setImageQuality = usePreferences((p) => p.setImageQuality);
  const languages = usePreferences((p) => p.languages);
  const cache = useSongCacheSettings();

  return (
    <View style={{ flex: 1, paddingBottom: playerDockInset }}>
      <Host style={{ flex: 1 }}>
        <FieldGroup>
          <FieldGroup.Section title="Account">
            {user ? (
              <>
                <ProfileHeader user={user} />
                <NavigationRow
                  label="Edit profile"
                  icon={{ name: "person.crop.circle.fill", color: "#0A84FF" }}
                  onPress={() => router.push("/profile")}
                />
                <NavigationRow
                  label="Change password"
                  icon={{ name: "lock.fill", color: "#8E8E93" }}
                  onPress={() => router.push("/password")}
                />
                <ActionRow
                  label="Sign out"
                  icon={{
                    name: "rectangle.portrait.and.arrow.right",
                    color: "#FF453A",
                  }}
                  destructive
                  onPress={() => void signOut()}
                />
              </>
            ) : (
              <NavigationRow
                label="Sign in to continue"
                detail="Sign in to edit your profile and change your password."
                icon={{ name: "person.crop.circle.fill", color: "#0A84FF" }}
                onPress={() => router.push("/login")}
              />
            )}
          </FieldGroup.Section>

          <FieldGroup.Section title="Appearance">
            <PickerRow
              label="Theme"
              icon={{ name: "circle.lefthalf.filled", color: "#5E5CE6" }}
              value={appearance}
              options={appearanceOptions}
              onChange={appearanceStore.getState().setMode}
            />
            <PickerRow
              label="Accent color"
              icon={{ name: "paintpalette.fill", color: accentSwatch }}
              value={accent}
              options={accentOptions}
              onChange={appearanceStore.getState().setAccent}
            />
            <PickerRow
              label="Corners"
              icon={{ name: "app.fill", color: "#8E8E93" }}
              value={corners}
              options={cornerOptions}
              onChange={appearanceStore.getState().setCorners}
            />
          </FieldGroup.Section>

          <FieldGroup.Section title="Playback">
            <PickerRow
              label="Stream quality"
              icon={{ name: "waveform", color: "#FF375F" }}
              value={streamQuality}
              options={qualityOptions}
              onChange={setStreamQuality}
            />
            <PickerRow
              label="Download quality"
              icon={{ name: "arrow.down.circle.fill", color: "#30B0C7" }}
              value={downloadQuality}
              options={qualityOptions}
              onChange={setDownloadQuality}
            />
            <PickerRow
              label="Image quality"
              icon={{ name: "photo.fill", color: "#FF9F0A" }}
              value={imageQuality}
              options={imageQualityOptions}
              onChange={setImageQuality}
            />
            <NavigationRow
              label="Languages"
              icon={{ name: "globe", color: "#0A84FF" }}
              detail={languagesSummary(languages)}
              onPress={() => router.push("/languages")}
            />
          </FieldGroup.Section>

          <FieldGroup.Section title="Storage">
            <SwitchRow
              label="Cache frequently played songs"
              icon={{ name: "arrow.down.circle.fill", color: "#30B0C7" }}
              value={cache.enabled}
              onChange={cache.setEnabled}
            />
            <ValueRow
              label="Cached songs"
              icon={{ name: "internaldrive.fill", color: "#8E8E93" }}
              value={cache.size}
            />
            <ActionRow
              label="Clear cache"
              icon={{ name: "trash.fill", color: "#FF453A" }}
              destructive
              onPress={cache.clear}
            />
          </FieldGroup.Section>

          {user ? (
            <FieldGroup.Section title="Security">
              <ActionRow
                label="Delete account"
                icon={{ name: "trash.fill", color: "#FF453A" }}
                destructive
                onPress={() => router.push("/delete-account")}
              />
            </FieldGroup.Section>
          ) : null}

          <FieldGroup.Section title="About">
            <ActionRow
              label="Privacy policy"
              icon={{ name: "hand.raised.fill", color: "#30D158" }}
              onPress={() => void openBrowserAsync(`${env.apiUrl}/privacy`)}
            />
            <ActionRow
              label="Terms of service"
              icon={{ name: "doc.text.fill", color: "#8E8E93" }}
              onPress={() => void openBrowserAsync(`${env.apiUrl}/terms`)}
            />
            <ValueRow
              label="Version"
              icon={{ name: "info.circle.fill", color: "#8E8E93" }}
              value={Constants.expoConfig?.version ?? ""}
            />
          </FieldGroup.Section>
        </FieldGroup>
      </Host>
    </View>
  );
}
