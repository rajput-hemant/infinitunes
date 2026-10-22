import { Stack, useRouter } from "expo-router";
import { useRef, useState } from "react";
import type { ComponentRef } from "react";
import { Pressable, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "~/components/ui/icon";
import { IconButton } from "~/components/ui/icon-button";
import { space, typeScale } from "~/theme/tokens";
import { usePalette } from "~/theme/use-palette";

import { searchBarOptions } from "./search-bar-options";
import type { SearchHeaderProps } from "./search-header";

const BACK = { ios: "chevron.left", android: "arrow_back" } as const;
const SEARCH = { ios: "magnifyingglass", android: "search" } as const;
const CLEAR = { ios: "xmark", android: "close" } as const;

/**
 * Android: Material 3's search bar in place of the app bar (the native
 * header's field starts after the toolbar's 72dp title inset). Its anatomy
 * follows M3: at rest (empty, not focused) the bar leads with the magnifier;
 * expanded (focused or holding text) it leads with back, and clear ends it
 * while there is text. The system back gesture works in both states. The bar
 * is `surfaceContainerHighest` (`bg-muted`), a step above the Top Result
 * card's `surfaceContainerHigh`, so the two never merge. It is controlled by
 * `query`.
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
  const field = useRef<ComponentRef<typeof TextInput>>(null);
  const { placeholder, autoCapitalize, autoFocus } = searchBarOptions();
  const [focused, setFocused] = useState(autoFocus);
  const expanded = focused || query.length > 0;

  return (
    <View
      className="bg-background px-page pb-2"
      style={{ paddingTop: insets.top + space.sm }}
    >
      <Stack.Screen options={{ headerShown: false }} />
      {/* A tap anywhere on the bar opens the field; the field itself is what screen readers reach. */}
      <Pressable
        accessible={false}
        onPress={() => field.current?.focus()}
        className="h-row flex-row items-center rounded-full bg-muted px-1"
      >
        {expanded ? (
          <IconButton
            icon={BACK}
            label="Back"
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/")
            }
          />
        ) : (
          <View
            testID="search-bar-magnifier"
            className="size-touch items-center justify-center"
          >
            <Icon name={SEARCH} color={palette["muted-foreground"]} />
          </View>
        )}
        <TextInput
          ref={field}
          value={query}
          onChangeText={onChangeText}
          onSubmitEditing={(event) => onSubmit(event.nativeEvent.text)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
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
      </Pressable>
    </View>
  );
}
