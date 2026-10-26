import { fireEvent, screen } from "@testing-library/react-native";

import { renderScreen } from "~/test/render";

import { FilterField, FilterHeader } from "./song-filter.android";

describe("Android song filter", () => {
  it("puts no field in the app bar", async () => {
    await renderScreen(<FilterHeader query="" onChangeText={jest.fn()} />);

    expect(screen.queryByLabelText("Filter songs")).toBeNull();
  });

  it("filters as the listener types, with no clear while empty", async () => {
    const onChangeText = jest.fn();
    await renderScreen(<FilterField query="" onChangeText={onChangeText} />);

    await fireEvent.changeText(screen.getByLabelText("Filter songs"), "ari");

    expect(onChangeText).toHaveBeenCalledWith("ari");
    expect(screen.queryByRole("button", { name: "Clear filter" })).toBeNull();
  });

  it("clears the filter while there is text", async () => {
    const onChangeText = jest.fn();
    await renderScreen(<FilterField query="ari" onChangeText={onChangeText} />);

    await fireEvent.press(screen.getByRole("button", { name: "Clear filter" }));

    expect(onChangeText).toHaveBeenCalledWith("");
  });

  it("is inert while the list loads", async () => {
    await renderScreen(<FilterField query="" />);

    expect(screen.getByLabelText("Filter songs").props.editable).toBe(false);
  });
});
