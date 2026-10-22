import { Stack } from "expo-router";
import type { RefObject } from "react";
import type { SearchBarCommands } from "react-native-screens";

import { searchBarOptions } from "./search-bar-options";

export type SearchHeaderProps = {
  /** The field's text (Android's field is controlled by it). */
  query: string;
  /** iOS's native field keeps its own text: `searchFor` sets it through this. */
  fieldRef: RefObject<SearchBarCommands | null>;
  onChangeText: (text: string) => void;
  /** The keyboard's search key: the query is remembered. */
  onSubmit: (text: string) => void;
  onCancel: () => void;
};

/** iOS: the search tab's native header field (iOS 26 puts it in the tab bar). */
export function SearchHeader({
  fieldRef,
  onChangeText,
  onSubmit,
  onCancel,
}: SearchHeaderProps) {
  return (
    <Stack.Screen
      options={{
        title: "Search",
        headerSearchBarOptions: {
          ...searchBarOptions(),
          ref: fieldRef,
          onChangeText: (event) => onChangeText(event.nativeEvent.text),
          onSearchButtonPress: (event) => onSubmit(event.nativeEvent.text),
          onCancelButtonPress: onCancel,
        },
      }}
    />
  );
}
