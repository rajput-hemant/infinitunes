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
import { accentColors, sizes } from "~/theme/tokens";

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
import { ROW_TINT } from "./tap-row-props";
import { ActionRow, NavigationRow } from "./tap-rows";
import { useSongCacheSettings } from "./use-song-cache-settings";

/**
 * Every setting on one native grouped list (a SwiftUI `Form`, a Material 3
 * list), like the web's single settings page. The list scrolls itself, so
 * it stops above the floating mini-player instead of padding content: a view
 * around the host takes the inset (a native host's own padding need not shrink
 * its SwiftUI root). With the iOS 26 tab bar accessory the inset is 0. On a
 * wide window the list is at most `sizes.readable` wide, centred.
 */
export function SettingsScreen() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const appearance = useAppearanceMode();
  const accent = useAccent();
  const corners = useCornerStyle();
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const accentSwatch = accentColors(accent, scheme)?.primary ?? ROW_TINT.gray;
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
      <Host
        style={{
          flex: 1,
          width: "100%",
          maxWidth: sizes.readable,
          alignSelf: "center",
        }}
      >
        <FieldGroup>
          <FieldGroup.Section title="Account">
            {user ? (
              <>
                <ProfileHeader user={user} />
                <NavigationRow
                  label="Edit profile"
                  icon={{
                    name: "person.crop.circle.fill",
                    color: ROW_TINT.blue,
                  }}
                  onPress={() => router.push("/profile")}
                />
                <NavigationRow
                  label="Change password"
                  icon={{ name: "lock.fill", color: ROW_TINT.gray }}
                  onPress={() => router.push("/password")}
                />
                <ActionRow
                  label="Sign out"
                  icon={{
                    name: "rectangle.portrait.and.arrow.right",
                    color: ROW_TINT.red,
                  }}
                  destructive
                  onPress={() => void signOut()}
                />
              </>
            ) : (
              <NavigationRow
                label="Sign in to continue"
                detail="Sign in to edit your profile and change your password."
                icon={{ name: "person.crop.circle.fill", color: ROW_TINT.blue }}
                onPress={() => router.push("/login")}
              />
            )}
          </FieldGroup.Section>

          <FieldGroup.Section title="Appearance">
            <PickerRow
              label="Theme"
              icon={{ name: "circle.lefthalf.filled", color: ROW_TINT.indigo }}
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
              icon={{ name: "app.fill", color: ROW_TINT.gray }}
              value={corners}
              options={cornerOptions}
              onChange={appearanceStore.getState().setCorners}
            />
          </FieldGroup.Section>

          <FieldGroup.Section title="Playback">
            <PickerRow
              label="Stream quality"
              icon={{ name: "waveform", color: ROW_TINT.pink }}
              value={streamQuality}
              options={qualityOptions}
              onChange={setStreamQuality}
            />
            <PickerRow
              label="Download quality"
              icon={{ name: "arrow.down.circle.fill", color: ROW_TINT.teal }}
              value={downloadQuality}
              options={qualityOptions}
              onChange={setDownloadQuality}
            />
            <PickerRow
              label="Image quality"
              icon={{ name: "photo.fill", color: ROW_TINT.orange }}
              value={imageQuality}
              options={imageQualityOptions}
              onChange={setImageQuality}
            />
            <NavigationRow
              label="Languages"
              icon={{ name: "globe", color: ROW_TINT.blue }}
              detail={languagesSummary(languages)}
              onPress={() => router.push("/languages")}
            />
          </FieldGroup.Section>

          <FieldGroup.Section title="Storage">
            <SwitchRow
              label="Cache frequently played songs"
              icon={{ name: "arrow.down.circle.fill", color: ROW_TINT.teal }}
              value={cache.enabled}
              onChange={cache.setEnabled}
            />
            <ValueRow
              label="Cached songs"
              icon={{ name: "internaldrive.fill", color: ROW_TINT.gray }}
              value={cache.size}
            />
            <ActionRow
              label="Clear cache"
              icon={{ name: "trash.fill", color: ROW_TINT.red }}
              destructive
              onPress={cache.clear}
            />
          </FieldGroup.Section>

          {user ? (
            <FieldGroup.Section title="Security">
              <ActionRow
                label="Delete account"
                icon={{ name: "trash.fill", color: ROW_TINT.red }}
                destructive
                onPress={() => router.push("/delete-account")}
              />
            </FieldGroup.Section>
          ) : null}

          <FieldGroup.Section title="About">
            <ActionRow
              label="Privacy policy"
              icon={{ name: "hand.raised.fill", color: ROW_TINT.green }}
              onPress={() => void openBrowserAsync(`${env.apiUrl}/privacy`)}
            />
            <ActionRow
              label="Terms of service"
              icon={{ name: "doc.text.fill", color: ROW_TINT.gray }}
              onPress={() => void openBrowserAsync(`${env.apiUrl}/terms`)}
            />
            <ValueRow
              label="Version"
              icon={{ name: "info.circle.fill", color: ROW_TINT.gray }}
              value={Constants.expoConfig?.version ?? ""}
            />
          </FieldGroup.Section>
        </FieldGroup>
      </Host>
    </View>
  );
}
