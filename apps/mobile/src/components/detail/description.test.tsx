import { fireEvent, screen } from "@testing-library/react-native";

import { renderWithProviders } from "~/test/render";

import { Description } from "./description";

async function layOut(lines: number) {
  await fireEvent(screen.getByText("About"), "textLayout", {
    nativeEvent: { lines: Array.from({ length: lines }, () => ({})) },
  });
}

describe("Description", () => {
  it("is plain text when it fits the preview", async () => {
    await renderWithProviders(<Description text="About" />);
    await layOut(2);

    expect(screen.queryByText("Read More")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("clamps longer text and opens it on a tap", async () => {
    await renderWithProviders(<Description text="About" />);
    await layOut(3);

    expect(screen.getByText("About").props.numberOfLines).toBe(3);
    await fireEvent.press(screen.getByRole("button", { expanded: false }));

    expect(screen.getByText("About").props.numberOfLines).toBeUndefined();
    expect(screen.getByText("Read Less")).toBeTruthy();
  });
});
