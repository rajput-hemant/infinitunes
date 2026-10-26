import { render, screen } from "@testing-library/react-native";

import { Spinner } from "./spinner";

describe("Spinner (iOS)", () => {
  it("is one progressbar named Loading, in a touch-height box", async () => {
    await render(<Spinner />);

    const mark = screen.getByLabelText("Loading");
    expect(mark).toHaveProp("accessibilityRole", "progressbar");
    expect(mark).toHaveProp("accessible", true);
    expect(mark).toHaveStyle({ width: 48, height: 48 });
  });
});
