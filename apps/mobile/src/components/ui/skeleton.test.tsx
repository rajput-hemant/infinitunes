import { render, screen } from "@testing-library/react-native";

import { pulseStyleFor, SkeletonPulse } from "./skeleton";

describe("SkeletonPulse", () => {
  it("is one labelled progress indicator", async () => {
    await render(<SkeletonPulse>{null}</SkeletonPulse>);

    expect(screen.getByRole("progressbar", { name: "Loading" })).toBeVisible();
  });

  it("pulses, unless the system asks for reduced motion", () => {
    expect(pulseStyleFor(false)).toMatchObject({
      animationIterationCount: "infinite",
    });
    expect(pulseStyleFor(true)).toBeUndefined();
  });
});
