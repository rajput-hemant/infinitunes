import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { appearanceStore } from "./appearance";
import { ThemeRoot } from "./theme-root";
import { colors } from "./tokens";

jest.mock("nativewind", () => ({
  vars: (variables: Record<string, string>) => ({ variables }),
}));
// Android's builder; the wallpaper palette under it is the neutral one.
jest.mock("./accent-palette", () =>
  jest.requireActual("./accent-palette.android"),
);
jest.mock("./android-colors", () => ({
  paletteFor: (scheme: "light" | "dark") =>
    jest.requireActual("./tokens").colors[scheme],
}));

const PLAYING = { primary: "#9ecaff", foreground: "#003258" };
let mockPlaying: typeof PLAYING | undefined;
jest.mock("./playing-accent", () => ({
  usePlayingAccent: () => mockPlaying,
}));

function rootVariables(): Record<string, string> {
  const style = [screen.root?.props.style].flat(Infinity) as {
    variables?: Record<string, string>;
  }[];
  return Object.assign({}, ...style.map((entry) => entry?.variables ?? {}));
}

describe("ThemeRoot (Android)", () => {
  beforeEach(() => {
    appearanceStore.getState().setAccent("default");
    mockPlaying = undefined;
  });

  it("takes primary from what is playing, under the default accent", async () => {
    mockPlaying = PLAYING;
    await render(
      <ThemeRoot>
        <Text>Inside</Text>
      </ThemeRoot>,
    );
    expect(rootVariables()).toMatchObject({
      "--primary": PLAYING.primary,
      "--primary-foreground": PLAYING.foreground,
    });
    expect(rootVariables()).not.toHaveProperty("--card");
  });

  it("lets an explicit accent win over the playing one", async () => {
    mockPlaying = PLAYING;
    appearanceStore.getState().setAccent("teal");
    await render(
      <ThemeRoot>
        <Text>Inside</Text>
      </ThemeRoot>,
    );
    expect(rootVariables()["--primary"]).not.toBe(PLAYING.primary);
  });

  it("leaves the wallpaper colours alone without an accent", async () => {
    await render(
      <ThemeRoot>
        <Text>Inside</Text>
      </ThemeRoot>,
    );
    expect(rootVariables()).not.toHaveProperty("--primary");
    expect(rootVariables()).not.toHaveProperty("--card");
  });

  it("points every colour class at the accent's scheme", async () => {
    appearanceStore.getState().setAccent("teal");
    await render(
      <ThemeRoot>
        <Text>Inside</Text>
      </ThemeRoot>,
    );
    const set = rootVariables();
    expect(set["--card"]).toMatch(/^#[\da-f]{6}$/);
    expect(set["--card"]).not.toBe(colors.light.card);
    expect(set["--secondary"]).not.toBe(colors.light.secondary);
    expect(set["--fill"]).toBe(colors.light.fill);
    expect(set).toHaveProperty("--radius-md");
  });
});
