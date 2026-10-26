import { Stack } from "expo-router";

export const FILTER_PLACEHOLDER = "Filter by title or artist";

export type SongFilterProps = {
  /** The filter's text (Android's field is controlled by it). */
  query: string;
  /** Without it the field is drawn inert (the loading screen's). */
  onChangeText?: (text: string) => void;
};

/** iOS: the native header's search field filters the list. */
export function FilterHeader({ onChangeText }: SongFilterProps) {
  return (
    <Stack.SearchBar
      placeholder={FILTER_PLACEHOLDER}
      autoCapitalize="none"
      onChangeText={
        onChangeText && ((event) => onChangeText(event.nativeEvent.text))
      }
    />
  );
}

/** iOS: nothing at the top of the list; the header holds the field. */
export const FilterField: (props: SongFilterProps) => null = () => null;
