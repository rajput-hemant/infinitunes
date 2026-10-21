import { FieldGroup, Host } from "@expo/ui";
import { QUALITIES_MAP } from "@infinitunes/types";
import type { ImageQuality } from "@infinitunes/types";
import Constants from "expo-constants";
import { router } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import { toast } from "sonner-native";

import { authClient } from "~/lib/auth-client";
import { env } from "~/lib/env";
import { usePreferences } from "~/lib/preferences";
import { playerDockInset } from "~/navigation/player-dock";
import {
  APPEARANCE_MODES,
  appearanceStore,
  useAppearanceMode,
} from "~/theme/appearance";

import { signOut } from "./end-session";
import { languagesSummary } from "./languages-screen";
import { PickerRow, ValueRow } from "./selection-rows";
import { ActionRow, NavigationRow } from "./tap-rows";

const titleCase = (value: string) =>
  `${value.charAt(0).toUpperCase()}${value.slice(1)}`;

const appearanceOptions = APPEARANCE_MODES.map((mode) => ({
  label: titleCase(mode),
  value: mode,
}));

const qualityOptions = QUALITIES_MAP.map(({ quality, bitrate }) => ({
  label: `${titleCase(quality)} (${bitrate})`,
  value: quality,
}));

const IMAGE_QUALITIES = [
  "low",
  "medium",
  "high",
] as const satisfies readonly ImageQuality[];

const imageQualityOptions = IMAGE_QUALITIES.map((value) => ({
  label: titleCase(value),
  value,
}));

async function signOutWithToast() {
  const failure = await signOut();
  if (failure) toast.error(failure.message);
}

/**
 * Every setting on one native grouped list (a SwiftUI `Form`, a Material 3
 * list), like the web's single settings page. The list scrolls itself, so
 * the host stops above the floating mini-player instead of padding content.
 */
export function SettingsScreen() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const appearance = useAppearanceMode();
  const streamQuality = usePreferences((p) => p.streamQuality);
  const downloadQuality = usePreferences((p) => p.downloadQuality);
  const setStreamQuality = usePreferences((p) => p.setStreamQuality);
  const setDownloadQuality = usePreferences((p) => p.setDownloadQuality);
  const imageQuality = usePreferences((p) => p.imageQuality);
  const setImageQuality = usePreferences((p) => p.setImageQuality);
  const languages = usePreferences((p) => p.languages);

  return (
    <Host style={{ flex: 1, paddingBottom: playerDockInset }}>
      <FieldGroup>
        <FieldGroup.Section title="Account">
          {user ? (
            <>
              <NavigationRow
                label="Profile"
                detail={user.name ? `${user.name}, ${user.email}` : user.email}
                onPress={() => router.push("/profile")}
              />
              <NavigationRow
                label="Change password"
                onPress={() => router.push("/password")}
              />
              <ActionRow
                label="Sign out"
                destructive
                onPress={() => void signOutWithToast()}
              />
            </>
          ) : (
            <NavigationRow
              label="Sign in to continue"
              detail="Sign in to edit your profile and change your password."
              onPress={() => router.push("/login")}
            />
          )}
        </FieldGroup.Section>

        <FieldGroup.Section title="Appearance">
          <PickerRow
            label="Theme"
            value={appearance}
            options={appearanceOptions}
            onChange={appearanceStore.getState().setMode}
          />
        </FieldGroup.Section>

        <FieldGroup.Section title="Playback">
          <PickerRow
            label="Stream quality"
            value={streamQuality}
            options={qualityOptions}
            onChange={setStreamQuality}
          />
          <PickerRow
            label="Download quality"
            value={downloadQuality}
            options={qualityOptions}
            onChange={setDownloadQuality}
          />
          <PickerRow
            label="Image quality"
            value={imageQuality}
            options={imageQualityOptions}
            onChange={setImageQuality}
          />
          <NavigationRow
            label="Languages"
            detail={languagesSummary(languages)}
            onPress={() => router.push("/languages")}
          />
        </FieldGroup.Section>

        <FieldGroup.Section title="Security">
          {user ? (
            <ActionRow
              label="Delete account"
              destructive
              onPress={() => router.push("/delete-account")}
            />
          ) : (
            <NavigationRow
              label="Sign in to continue"
              detail="Sign in to manage your account or delete it."
              onPress={() => router.push("/login")}
            />
          )}
        </FieldGroup.Section>

        <FieldGroup.Section title="About">
          <ActionRow
            label="Privacy policy"
            onPress={() => void openBrowserAsync(`${env.apiUrl}/privacy`)}
          />
          <ActionRow
            label="Terms of service"
            onPress={() => void openBrowserAsync(`${env.apiUrl}/terms`)}
          />
          <ValueRow
            label="Version"
            value={Constants.expoConfig?.version ?? ""}
          />
        </FieldGroup.Section>
      </FieldGroup>
    </Host>
  );
}
