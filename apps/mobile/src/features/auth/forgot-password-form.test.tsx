import { fireEvent, screen } from "@testing-library/react-native";
import { toast } from "sonner-native";

import { renderScreen } from "~/test/render";

import { authClient } from "./auth-client-mock";
import {
  FORGOT_PASSWORD_MESSAGE,
  ForgotPasswordForm,
} from "./forgot-password-form";

jest.mock("~/lib/auth-client", () =>
  require("~/features/auth/auth-client-mock"),
);

async function request(email: string) {
  await fireEvent.changeText(screen.getByLabelText("Email"), email);
  await fireEvent.press(
    screen.getByRole("button", { name: "Send reset link" }),
  );
}

describe("ForgotPasswordForm", () => {
  it("validates the email first", async () => {
    await renderScreen(<ForgotPasswordForm />);

    await request("nope");

    expect(screen.getByText("Please enter a valid email")).toBeOnTheScreen();
    expect(authClient.requestPasswordReset).not.toHaveBeenCalled();
  });

  it("asks for a link to the web's reset page, never to the app's scheme", async () => {
    await renderScreen(<ForgotPasswordForm />);

    await request("  Listener@Example.com ");

    expect(authClient.requestPasswordReset).toHaveBeenCalledTimes(1);
    // An https `redirectTo` passes the server's web-only redirect check.
    expect(authClient.requestPasswordReset).toHaveBeenCalledWith({
      email: "listener@example.com",
      redirectTo: "https://infinitunes.test/reset-password",
    });
  });

  it("gives the same answer for every valid email", async () => {
    await renderScreen(<ForgotPasswordForm />);

    await request("listener@example.com");

    expect(screen.getByText(FORGOT_PASSWORD_MESSAGE)).toBeOnTheScreen();
    expect(screen.queryByLabelText("Email")).toBeNull();
  });

  it("says so when the request limit is hit, and keeps the form", async () => {
    authClient.requestPasswordReset.mockResolvedValueOnce({
      error: { status: 429 },
    });
    await renderScreen(<ForgotPasswordForm />);

    await request("listener@example.com");

    expect(toast.error).toHaveBeenCalledWith(
      "Too many attempts. Please wait a minute and try again.",
    );
    expect(screen.getByLabelText("Email")).toBeOnTheScreen();
  });

  it("does not leak a server fault's details", async () => {
    authClient.requestPasswordReset.mockResolvedValueOnce({
      error: { status: 500, message: "SMTP exploded" },
    });
    await renderScreen(<ForgotPasswordForm />);

    await request("listener@example.com");

    expect(toast.error).toHaveBeenCalledWith(
      "Something went wrong. Please try again.",
    );
  });
});
