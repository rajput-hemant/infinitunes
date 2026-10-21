import { Stack } from "expo-router";
import { useState } from "react";

import { ScreenScrollView } from "~/components/screen-scroll-view";
import { Text } from "~/components/ui/text";

export default function SearchScreen() {
  const [query, setQuery] = useState("");

  return (
    <>
      <Stack.Screen
        options={{
          headerSearchBarOptions: {
            placeholder: "Songs, albums, artists",
            onChangeText: (event) => setQuery(event.nativeEvent.text),
          },
        }}
      />
      <ScreenScrollView contentContainerClassName="gap-2 px-page">
        <Text tone="muted">
          {query ? `Results for "${query}"` : "Search the catalog."}
        </Text>
      </ScreenScrollView>
    </>
  );
}
