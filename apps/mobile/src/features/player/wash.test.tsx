import { act, render, screen } from "@testing-library/react-native";

import { Backdrop } from "./wash";
import type { BackdropFill } from "./wash";

const solid = (key: string, backgroundColor: string): BackdropFill => ({
  key,
  style: { backgroundColor },
});

const current = () => screen.getByTestId("player-backdrop-current");
const below = () => screen.queryAllByTestId("player-backdrop-below");

/**
 * Ends a layer's entering animation as Reanimated would: through the
 * builder's callback (`callbackV`, what `withCallback` stores).
 */
async function finishFade(
  layer: ReturnType<typeof current> | undefined,
  finished = true,
) {
  const entering = layer?.props.entering as
    | { callbackV?: (finished: boolean) => void }
    | undefined;
  if (!entering?.callbackV) throw new Error("the layer has no fade");
  const callback = entering.callbackV;
  await act(async () => {
    callback(finished);
    jest.runOnlyPendingTimers();
  });
}

describe("Backdrop", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("paints the latest style of a fill whose key stays (a scheme flip)", async () => {
    const { rerender } = await render(
      <Backdrop fill={solid("card", "#fefefe")} />,
    );
    expect(current()).toHaveStyle({ backgroundColor: "#fefefe" });

    await rerender(<Backdrop fill={solid("card", "#1b1b1f")} />);

    expect(current()).toHaveStyle({ backgroundColor: "#1b1b1f" });
    // Same surface, so no crossfade: nothing is left underneath.
    expect(below()).toHaveLength(0);
  });

  it("fades each new fill over the ones showing, then drops them", async () => {
    const { rerender } = await render(
      <Backdrop fill={solid("a", "#aa0000")} />,
    );

    await rerender(<Backdrop fill={solid("b", "#00bb00")} />);
    await rerender(<Backdrop fill={solid("c", "#0000cc")} />);

    // A rapid skip keeps B (still fading in) under C: nothing snaps.
    expect(current()).toHaveStyle({ backgroundColor: "#0000cc" });
    expect(below().map((layer) => layer.props.style)).toEqual([
      expect.arrayContaining([{ backgroundColor: "#aa0000" }]),
      expect.arrayContaining([{ backgroundColor: "#00bb00" }]),
    ]);

    // Jest runs no layout animations: finish them by hand, B first.
    await finishFade(below()[1]);
    expect(below()).toHaveLength(1);
    await finishFade(current());

    expect(below()).toHaveLength(0);
    expect(current()).toHaveStyle({ backgroundColor: "#0000cc" });
  });

  it("keeps the layers under a fade that did not finish", async () => {
    const { rerender } = await render(
      <Backdrop fill={solid("a", "#aa0000")} />,
    );
    await rerender(<Backdrop fill={solid("b", "#00bb00")} />);

    await finishFade(current(), false);

    expect(below()).toHaveLength(1);
  });
});
