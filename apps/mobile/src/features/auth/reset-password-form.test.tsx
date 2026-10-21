import { fireEvent, screen } from "@testing-library/react-native";
import { toast } from "sonner-native";

import { renderScreen } from "~/test/render";

import { authClient } from "./auth-client-mock";
import { ResetPasswordForm } from "./reset-password-form";

jest.mock("~/lib/auth-client", () =>
  require("~/features/auth/auth-client-mock"),
);

async function reset(password: string, confirm: string) {
  await fireEvent.changeText(screen.getByLabelText("New password"), password);
  await fireEvent.changeText(
    screen.getByLabelText("Confirm new password"),
    confirm,
  );
  await fireEvent.press(screen.getByRole("button", { name: "Reset password" }));
}

describe("ResetPasswordForm", () => {
  it.each([
    ["has no token", undefined, undefined],
    ["was refused by the server", "tok_123", "INVALID_TOKEN"],
  ])("offers a new link when the link %s", async (_case, token, linkError) => {
    await renderScreen(
      <ResetPasswordForm token={token} linkError={linkError} />,
    );

    expect(screen.getByText("Request a new link")).toBeOnTheScreen();
    expect(screen.queryByLabelText("New password")).toBeNull();
  });

  it("checks the new password before sending it", async () => {
    await renderScreen(
      <ResetPasswordForm token="tok_123" linkError={undefined} />,
    );

    await reset("Short1", "Short1");

    expect(
      screen.getByText("Password must contain at least one special character."),
    ).toBeOnTheScreen();
    expect(authClient.resetPassword).not.toHaveBeenCalled();
  });

  it("sets the password with the link's token", async () => {
    await renderScreen(
      <ResetPasswordForm token="tok_123" linkError={undefined} />,
    );

    await reset("Secret#123", "Secret#123");

    expect(authClient.resetPassword).toHaveBeenCalledWith({
      newPassword: "Secret#123",
      token: "tok_123",
    });
    expect(toast.success).toHaveBeenCalledWith(
      "Password reset. Please sign in with your new password.",
    );
  });

  it("turns a rejected token into the invalid-link state", async () => {
    authClient.resetPassword.mockResolvedValueOnce({
      error: { status: 400, code: "INVALID_TOKEN", message: "Invalid token" },
    });
    await renderScreen(
      <ResetPasswordForm token="tok_123" linkError={undefined} />,
    );

    await reset("Secret#123", "Secret#123");

    expect(screen.getByText("Request a new link")).toBeOnTheScreen();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("toasts any other failure and keeps the form", async () => {
    authClient.resetPassword.mockResolvedValueOnce({ error: { status: 429 } });
    await renderScreen(
      <ResetPasswordForm token="tok_123" linkError={undefined} />,
    );

    await reset("Secret#123", "Secret#123");

    expect(toast.error).toHaveBeenCalledWith(
      "Too many attempts. Please wait a minute and try again.",
    );
    expect(screen.getByLabelText("New password")).toBeOnTheScreen();
  });
});
