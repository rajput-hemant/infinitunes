import { Stack, useRouter } from "expo-router";
import { TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconButton } from "~/components/ui/icon-button";
import { space, typeScale } from "~/theme/tokens";
import { usePalette } from "~/theme/use-palette";

import { searchBarOptions } from "./search-bar-options";
import type { SearchHeaderProps } from "./search-header";

const BACK = { ios: "chevron.left", android: "arrow_back" } as const;
const CLEAR = { ios: "xmark", android: "close" } as const;

/**
 * Android: Material 3's search bar in place of the app bar. The native
 * header's field starts after the toolbar's 72dp title inset, far from the
 * back arrow, so the header is hidden and this full-width 56dp pill carries
 * back, the field and clear. It is controlled by `query`.
 */
export function SearchHeader({
  query,
  onChangeText,
  onSubmit,
  onCancel,
}: SearchHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  const { placeholder, autoCapitalize, autoFocus } = searchBarOptions();

  return (
    <View
      className="bg-background px-page pb-2"
      style={{ paddingTop: insets.top + space.sm }}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View className="h-row flex-row items-center rounded-full bg-card px-1">
        <IconButton
          icon={BACK}
          label="Back"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
        />
        <TextInput
          value={query}
          onChangeText={onChangeText}
          onSubmitEditing={(event) => onSubmit(event.nativeEvent.text)}
          placeholder={placeholder}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          // Search is pushed from the app bar's search action: the tap means "type now".
          // oxlint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={autoFocus}
          returnKeyType="search"
          accessibilityLabel="Search"
          placeholderTextColor={palette["muted-foreground"]}
          selectionColor={palette.primary}
          style={{
            fontSize: typeScale.android.body.fontSize,
            color: palette.foreground,
          }}
          className="flex-1 px-1"
        />
        {query ? (
          <IconButton icon={CLEAR} label="Clear search" onPress={onCancel} />
        ) : null}
      </View>
    </View>
  );
}
