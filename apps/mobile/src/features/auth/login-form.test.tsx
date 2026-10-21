import { act, fireEvent, screen } from "@testing-library/react-native";
import { toast } from "sonner-native";

import { renderScreen } from "~/test/render";

import { authClient } from "./auth-client-mock";
import type { AuthResult } from "./auth-client-mock";
import { LoginForm } from "./login-form";

jest.mock("~/lib/auth-client", () =>
  require("~/features/auth/auth-client-mock"),
);

async function fillAndSubmit(email: string, password: string) {
  await fireEvent.changeText(screen.getByLabelText("Email"), email);
  await fireEvent.changeText(screen.getByLabelText("Password"), password);
  await fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
}

describe("LoginForm", () => {
  it("shows what is missing and sends nothing", async () => {
    await renderScreen(<LoginForm />);

    await fireEvent.press(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByText("Email is Required")).toBeOnTheScreen();
    expect(screen.getByText("Password is Required")).toBeOnTheScreen();
    expect(authClient.signIn.email).not.toHaveBeenCalled();
  });

  it("rejects a malformed email, and clears the message when typing", async () => {
    await renderScreen(<LoginForm />);

    await fillAndSubmit("not-an-email", "Secret#123");
    expect(screen.getByText("Please enter a valid email")).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText("Email"), "a@b.co");
    expect(screen.queryByText("Please enter a valid email")).toBeNull();
  });

  it("signs in with the credentials and no redirect target", async () => {
    await renderScreen(<LoginForm />);

    await fillAndSubmit("listener@example.com", "Secret#123");

    // The server rejects callback URLs in the app's scheme (403), so none is sent.
    expect(authClient.signIn.email).toHaveBeenCalledTimes(1);
    expect(authClient.signIn.email).toHaveBeenCalledWith({
      email: "listener@example.com",
      password: "Secret#123",
    });
    expect(toast.success).toHaveBeenCalledWith("You have been signed in.");
  });

  it("shows the server's message for a wrong password", async () => {
    authClient.signIn.email.mockResolvedValueOnce({
      error: { status: 401, message: "Invalid email or password" },
    });
    await renderScreen(<LoginForm />);

    await fillAndSubmit("listener@example.com", "Wrong#123");

    expect(toast.error).toHaveBeenCalledWith("Invalid email or password");
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("hides a server fault's details behind generic copy", async () => {
    authClient.signIn.email.mockResolvedValueOnce({
      error: { status: 500, message: "connect ECONNREFUSED 10.0.0.4:5432" },
    });
    await renderScreen(<LoginForm />);

    await fillAndSubmit("listener@example.com", "Secret#123");

    expect(toast.error).toHaveBeenCalledWith(
      "Something went wrong. Please try again.",
    );
  });

  it("says so when the request limit is hit", async () => {
    authClient.signIn.email.mockResolvedValueOnce({
      error: { status: 429 },
    });
    await renderScreen(<LoginForm />);

    await fillAndSubmit("listener@example.com", "Secret#123");

    expect(toast.error).toHaveBeenCalledWith(
      "Too many attempts. Please wait a minute and try again.",
    );
  });

  it("reports a request that never reached the server", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    authClient.signIn.email.mockRejectedValueOnce(
      new Error("Network request failed"),
    );
    await renderScreen(<LoginForm />);

    await fillAndSubmit("listener@example.com", "Secret#123");

    expect(toast.error).toHaveBeenCalledWith("Network request failed");
  });

  it("locks the form while signing in, and sends once", async () => {
    const request = Promise.withResolvers<AuthResult>();
    authClient.signIn.email.mockReturnValueOnce(request.promise);
    await renderScreen(<LoginForm />);

    await fillAndSubmit("listener@example.com", "Secret#123");
    const busy = screen.getByRole("button", { name: "Signing in..." });
    expect(busy).toBeDisabled();
    expect(screen.getByLabelText("Email").props.editable).toBe(false);
    await fireEvent.press(busy);

    await act(async () => request.resolve({ error: null }));
    expect(authClient.signIn.email).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
  });

  it("can show and hide the password", async () => {
    await renderScreen(<LoginForm />);
    const password = screen.getByLabelText("Password");
    expect(password.props.secureTextEntry).toBe(true);

    await fireEvent.press(
      screen.getByRole("button", { name: "Show password" }),
    );
    expect(screen.getByLabelText("Password").props.secureTextEntry).toBe(false);

    await fireEvent.press(
      screen.getByRole("button", { name: "Hide password" }),
    );
    expect(screen.getByLabelText("Password").props.secureTextEntry).toBe(true);
  });

  it("offers the platform's saved-credential autofill", async () => {
    await renderScreen(<LoginForm />);

    expect(screen.getByLabelText("Email").props).toMatchObject({
      textContentType: "username",
      keyboardType: "email-address",
      autoCapitalize: "none",
    });
    expect(screen.getByLabelText("Password").props).toMatchObject({
      textContentType: "password",
      autoComplete: "current-password",
    });
  });
});
