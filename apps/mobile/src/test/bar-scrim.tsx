import { screen } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { StyleSheet } from "react-native";

import { renderWithProviders } from "./render";

/**
 * The opacity of the Android `BarScrim` a screen installed as its
 * `headerBackground` through `setOptions` (outside a navigator the bar has no
 * height, so any scroll under it is fully opaque). Renders it as the screen.
 */
export async function installedScrimOpacity(
  setOptions: jest.Mock,
): Promise<number | undefined> {
  const options = setOptions.mock.calls
    .map(([value]) => value as { headerBackground?: () => ReactNode })
    .findLast((value) => value.headerBackground);
  if (!options?.headerBackground) return undefined;
  await renderWithProviders(<>{options.headerBackground()}</>);
  const style = StyleSheet.flatten(screen.getByTestId("bar-scrim").props.style);
  return style.opacity as number | undefined;
}
