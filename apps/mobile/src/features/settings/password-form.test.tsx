import { fireEvent, screen } from "@testing-library/react-native";

import { renderScreen } from "~/test/render";
import { procedure } from "~/test/trpc-mock";

import { PasswordForm } from "./password-form";

async function submit(current: string, next: string) {
  await fireEvent.changeText(
    screen.getByLabelText("Current password"),
    current,
  );
  await fireEvent.changeText(screen.getByLabelText("New password"), next);
  await fireEvent.press(
    screen.getByRole("button", { name: "Update password" }),
  );
}

describe("PasswordForm", () => {
  it("asks for both passwords", async () => {
    await renderScreen(<PasswordForm />);

    await fireEvent.press(
      screen.getByRole("button", { name: "Update password" }),
    );

    expect(screen.getAllByText("Password is Required")).toHaveLength(2);
    expect(procedure("user.changePassword")).not.toHaveBeenCalled();
  });

  it("holds the new password to the same rules as sign-up", async () => {
    await renderScreen(<PasswordForm />);

    await submit("Old#Secret1", "weakpass");

    expect(
      screen.getByText("Password must contain at least one uppercase letter."),
    ).toBeOnTheScreen();
    expect(procedure("user.changePassword")).not.toHaveBeenCalled();
  });

  it("changes the password", async () => {
    await renderScreen(<PasswordForm />);

    await submit("Old#Secret1", "New#Secret2");

    expect(procedure("user.changePassword")).toHaveBeenCalledWith({
      password: "Old#Secret1",
      newPassword: "New#Secret2",
    });
  });
});
