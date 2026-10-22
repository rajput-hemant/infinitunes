import { screen } from "@testing-library/react-native";

import {
  playbackPosition,
  playbackStatusStore,
} from "~/playback/playback-status";
import { renderScreen } from "~/test/render";
import { colors } from "~/theme/tokens";

import { DockProgress } from "./dock-progress";

it("draws the buffered dock segment under the played segment", async () => {
  playbackStatusStore.setState({ duration: 200, bufferedTime: 100 });
  playbackPosition.set(30);
  await renderScreen(<DockProgress color={colors.light.primary} />);

  expect(
    screen.getByTestId("dock-buffered", { includeHiddenElements: true }),
  ).toHaveStyle({ width: "50%", opacity: 0.35 });
  expect(
    screen.getByTestId("dock-progress", { includeHiddenElements: true }),
  ).toHaveStyle({ width: "15%" });
});
