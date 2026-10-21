import { screen } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";

import { renderScreen, renderWithProviders } from "~/test/render";
import { colors } from "~/theme/tokens";

import { FormField } from "./form-field";
import { FormLink } from "./form-link";

const announce = jest.spyOn(
  AccessibilityInfo,
  "announceForAccessibilityWithOptions",
);

beforeEach(() => announce.mockImplementation(() => {}));

const emailField = (error?: string) => (
  <FormField label="Email" value="" onChangeText={jest.fn()} error={error} />
);

describe("FormField", () => {
  it("puts the error on the input itself and announces it", async () => {
    const { rerender } = await renderWithProviders(emailField());
    expect(announce).not.toHaveBeenCalled();

    await rerender(emailField("Enter a valid email"));

    expect(screen.getByLabelText("Email")).toHaveProp(
      "accessibilityHint",
      "Error: Enter a valid email",
    );
    expect(announce).toHaveBeenCalledWith("Enter a valid email", {
      queue: true,
    });
  });

  it("reads the hint when there is no error", async () => {
    await renderWithProviders(
      <FormField
        label="Name"
        hint="Shown on your playlist"
        value=""
        onChangeText={jest.fn()}
      />,
    );

    expect(screen.getByLabelText("Name")).toHaveProp(
      "accessibilityHint",
      "Shown on your playlist",
    );
  });

  it("colours the placeholder with the AA-passing muted token", async () => {
    await renderWithProviders(
      <FormField
        label="Name"
        placeholder="Enter a name"
        value=""
        onChangeText={jest.fn()}
      />,
    );

    expect(screen.getByLabelText("Name")).toHaveProp(
      "placeholderTextColor",
      colors.light["muted-foreground"],
    );
  });
});

describe("FormLink", () => {
  it("is a link with a 48pt target", async () => {
    await renderScreen(<FormLink href="/login">Back to sign in</FormLink>, {
      routes: { login: () => null },
    });

    expect(screen.getByRole("link", { name: "Back to sign in" })).toHaveProp(
      "className",
      expect.stringContaining("min-h-touch"),
    );
  });
});
