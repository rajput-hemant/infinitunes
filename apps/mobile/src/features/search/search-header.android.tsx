import { Stack, useRouter } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SearchPill } from "~/components/search-pill";
import { IconButton } from "~/components/ui/icon-button";
import { space } from "~/theme/tokens";

import { searchBarOptions } from "./search-bar-options";
import type { SearchHeaderProps } from "./search-header";

const BACK = { ios: "chevron.left", android: "arrow_back" } as const;

/**
 * Android: Material 3's search bar in place of the app bar (the native
 * header's field starts after the toolbar's 72dp title inset). This screen is
 * pushed, so it follows M3's search view rather than the resting bar: back
 * leads in every state (a visible way out, not only the system gesture) and
 * clear ends it while there is text. The bar is `surfaceContainerHighest`,
 * a step above the Top Result card's `surfaceContainerHigh`, so the two never
 * merge. It is controlled by `query`.
 */
export function SearchHeader({
  query,
  onChangeText,
  onSubmit,
  onCancel,
}: SearchHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { placeholder, autoCapitalize, autoFocus } = searchBarOptions();

  return (
    <View
      className="bg-background px-page pb-2"
      style={{ paddingTop: insets.top + space.sm }}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <SearchPill
        value={query}
        onChangeText={onChangeText}
        onSubmit={onSubmit}
        label="Search"
        placeholder={placeholder}
        autoCapitalize={autoCapitalize}
        autoFocus={autoFocus}
        returnKeyType="search"
        onClear={onCancel}
        leading={
          <IconButton
            icon={BACK}
            label="Back"
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/")
            }
          />
        }
      />
    </View>
  );
}
