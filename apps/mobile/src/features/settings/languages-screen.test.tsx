import { fireEvent, screen } from "@testing-library/react-native";

import { preferencesStore } from "~/lib/preferences";
import { renderScreen } from "~/test/render";

import { languagesSummary, LanguagesScreen, toggled } from "./languages-screen";

const languages = () => preferencesStore.getState().languages;
const row = (name: string) => screen.getByRole("checkbox", { name });

beforeEach(() => preferencesStore.getState().setLanguages([]));

describe("LanguagesScreen", () => {
  it("shows the defaults checked while nothing is chosen", async () => {
    await renderScreen(<LanguagesScreen />);

    expect(row("Hindi")).toBeChecked();
    expect(row("English")).toBeChecked();
    expect(row("Tamil")).not.toBeChecked();
  });

  it("starts from the defaults, kept in the catalog's order", async () => {
    await renderScreen(<LanguagesScreen />);

    await fireEvent.press(row("Tamil"));
    expect(languages()).toEqual(["hindi", "english", "tamil"]);

    await fireEvent.press(row("Hindi"));
    expect(languages()).toEqual(["english", "tamil"]);
    expect(row("Hindi")).not.toBeChecked();
  });

  it("keeps the last checked language", async () => {
    preferencesStore.getState().setLanguages(["tamil"]);
    await renderScreen(<LanguagesScreen />);

    await fireEvent.press(row("Tamil"));
    expect(languages()).toEqual(["tamil"]);
    expect(row("Tamil")).toBeChecked();
  });
});

describe("toggled", () => {
  it("unchecking a default leaves the other", () => {
    expect(toggled([], "english")).toEqual(["hindi"]);
  });
});

describe("languagesSummary", () => {
  it("names the choice, or the catalog's default without one", () => {
    expect(languagesSummary(["hindi", "tamil"])).toBe("Hindi, Tamil");
    expect(languagesSummary([])).toBe("Hindi, English (default)");
  });
});
