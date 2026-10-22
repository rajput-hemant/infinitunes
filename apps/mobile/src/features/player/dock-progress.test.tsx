import { screen } from "@testing-library/react-native";

import {
  playbackPosition,
  playbackStatusStore,
} from "~/playback/playback-status";
import { renderScreen } from "~/test/render";
import { colors } from "~/theme/tokens";

import { DockProgress } from "./dock-progress";

const segment = (testID: string) =>
  screen.getByTestId(testID, { includeHiddenElements: true });

it("draws the buffered dock segment under the played segment", async () => {
  playbackStatusStore.setState({ duration: 200, bufferedTime: 100 });
  playbackPosition.set(30);
  await renderScreen(<DockProgress color={colors.light.primary} />);

  expect(segment("dock-buffered")).toHaveStyle({
    transform: [{ scaleX: 0.5 }],
  });
  expect(segment("dock-buffered")).toHaveStyle({ opacity: 0.35 });
  expect(segment("dock-progress")).toHaveStyle({
    transform: [{ scaleX: 0.15 }],
  });
});
