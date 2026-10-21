import { fireEvent, screen } from "@testing-library/react-native";

import { preferencesStore } from "~/lib/preferences";
import { renderScreen } from "~/test/render";

import { languagesSummary, LanguagesScreen } from "./languages-screen";

const languages = () => preferencesStore.getState().languages;

beforeEach(() => preferencesStore.getState().setLanguages([]));

describe("LanguagesScreen", () => {
  it("adds and removes languages at once, kept in the catalog's order", async () => {
    await renderScreen(<LanguagesScreen />);

    await fireEvent.press(screen.getByRole("checkbox", { name: "Tamil" }));
    await fireEvent.press(screen.getByRole("checkbox", { name: "Hindi" }));
    expect(languages()).toEqual(["hindi", "tamil"]);
    expect(screen.getByRole("checkbox", { name: "Hindi" })).toBeChecked();

    await fireEvent.press(screen.getByRole("checkbox", { name: "Hindi" }));
    expect(languages()).toEqual(["tamil"]);
  });
});

describe("languagesSummary", () => {
  it("names the choice, or the catalog's default without one", () => {
    expect(languagesSummary(["hindi", "tamil"])).toBe("Hindi, Tamil");
    expect(languagesSummary([])).toBe("Hindi, English (default)");
  });
});
