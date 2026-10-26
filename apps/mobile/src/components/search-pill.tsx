import { useRef } from "react";
import type { ComponentRef, ReactNode } from "react";
import { Pressable, TextInput } from "react-native";
import type { TextInputProps } from "react-native";

import { IconButton } from "~/components/ui/icon-button";
import { typeScale } from "~/theme/tokens";
import { usePalette } from "~/theme/use-palette";

const CLEAR = { ios: "xmark", android: "close" } as const;

type SearchPillProps = Pick<
  TextInputProps,
  "placeholder" | "autoCapitalize" | "autoFocus" | "returnKeyType"
> & {
  /** The field's text: the pill is controlled. */
  value: string;
  onChangeText?: (text: string) => void;
  onSubmit?: (text: string) => void;
  /** The field's screen reader name. */
  label: string;
  /** Before the field: Back on a pushed search, a search mark on a filter. */
  leading: ReactNode;
  /** Clear, shown while there is text. */
  onClear?: () => void;
  clearLabel?: string;
  /** `false` draws the pill inert (a loading screen's). */
  editable?: boolean;
};

/**
 * Android: Material 3's search bar, a `bg-muted` pill
 * (`surfaceContainerHighest`) at the row height. A tap anywhere on it focuses
 * the field; the field itself is what screen readers reach. Used where the
 * native header's field would start after the toolbar's 72dp title inset.
 */
export function SearchPill({
  value,
  onChangeText,
  onSubmit,
  label,
  leading,
  onClear,
  clearLabel = "Clear search",
  editable = true,
  placeholder,
  autoCapitalize,
  autoFocus,
  returnKeyType,
}: SearchPillProps) {
  const palette = usePalette();
  const field = useRef<ComponentRef<typeof TextInput>>(null);

  return (
    <Pressable
      accessible={false}
      disabled={!editable}
      onPress={() => field.current?.focus()}
      className="h-row flex-row items-center rounded-full bg-muted px-1"
    >
      {leading}
      <TextInput
        ref={field}
        value={value}
        editable={editable}
        onChangeText={onChangeText}
        onSubmitEditing={(event) => onSubmit?.(event.nativeEvent.text)}
        placeholder={placeholder}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        // Only a screen pushed to search asks for it: the tap meant "type now".
        // oxlint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        returnKeyType={returnKeyType}
        accessibilityLabel={label}
        placeholderTextColor={palette["muted-foreground"]}
        selectionColor={palette.primary}
        style={{
          fontSize: typeScale.android.body.fontSize,
          color: palette.foreground,
        }}
        className="flex-1 px-1"
      />
      {value && onClear ? (
        <IconButton icon={CLEAR} label={clearLabel} onPress={onClear} />
      ) : null}
    </Pressable>
  );
}
