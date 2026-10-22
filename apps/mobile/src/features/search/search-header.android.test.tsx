import { fireEvent, screen } from "@testing-library/react-native";

import { renderScreen } from "~/test/render";

import { SearchHeader } from "./search-header.android";

function renderHeader(query: string, onCancel = jest.fn()) {
  return renderScreen(
    <SearchHeader
      query={query}
      fieldRef={{ current: null }}
      onChangeText={jest.fn()}
      onSubmit={jest.fn()}
      onCancel={onCancel}
    />,
  );
}

describe("Android SearchHeader", () => {
  it("keeps a labelled back while empty and unfocused, with no clear", async () => {
    await renderHeader("");
    await fireEvent(screen.getByLabelText("Search"), "blur");

    expect(screen.getByRole("button", { name: "Back" })).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();
  });

  it("shows back and clear while there is text", async () => {
    const onCancel = jest.fn();
    await renderHeader("arijit", onCancel);

    expect(screen.getByRole("button", { name: "Back" })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Clear search" }));

    expect(onCancel).toHaveBeenCalled();
  });
});
