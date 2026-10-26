import { selection, tap } from "~/lib/haptics";

import { playerHaptics, scrubStep } from "./haptics";

jest.mock("~/lib/haptics", () => ({ tap: jest.fn(), selection: jest.fn() }));

describe("playerHaptics", () => {
  it("maps the player's moments onto the shared intents", () => {
    expect(playerHaptics.press).toBe(tap);
    expect(playerHaptics.tick).toBe(selection);
    expect(playerHaptics.release).toBe(tap);
  });

  it("steps the scrubber once per 5% of the track", () => {
    expect(scrubStep(0, 200)).toBe(0);
    expect(scrubStep(9.9, 200)).toBe(0);
    expect(scrubStep(10, 200)).toBe(1);
  });
});
