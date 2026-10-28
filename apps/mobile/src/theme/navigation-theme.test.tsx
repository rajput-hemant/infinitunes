import { act, render } from "@testing-library/react-native";
import { useTheme, ThemeProvider } from "expo-router";
import { memo } from "react";
import type { ReactNode } from "react";
import { Text } from "react-native";

import { appearanceStore } from "./appearance";
import { useNavigationTheme as useAndroidTheme } from "./navigation-theme";
import { useNavigationTheme as useIosTheme } from "./navigation-theme.ios";

const initial = appearanceStore.getState();
afterEach(() => appearanceStore.setState(initial, true));

it.each([
  ["Android", useAndroidTheme],
  ["iOS", useIosTheme],
] as const)(
  "keeps %s theme consumers idle on unrelated provider renders",
  async (_platform, useNavigationTheme) => {
    const renderConsumer = jest.fn();
    const Consumer = memo(function Consumer() {
      const theme = useTheme();
      renderConsumer();
      return <Text>{String(theme.colors.primary)}</Text>;
    });
    function Root({ children }: { children: ReactNode }) {
      const theme = useNavigationTheme();
      return <ThemeProvider value={theme}>{children}</ThemeProvider>;
    }
    const child = <Consumer />;
    const result = await render(<Root>{child}</Root>);
    const before = renderConsumer.mock.calls.length;
    await result.rerender(<Root>{child}</Root>);
    expect(renderConsumer).toHaveBeenCalledTimes(before);
    await act(() => appearanceStore.getState().setAccent("teal"));
    expect(renderConsumer.mock.calls.length).toBeGreaterThan(before);
    const accented = renderConsumer.mock.calls.length;
    await result.rerender(<Root>{child}</Root>);
    expect(renderConsumer).toHaveBeenCalledTimes(accented);
  },
);
