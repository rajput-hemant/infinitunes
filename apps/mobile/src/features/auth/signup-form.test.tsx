import { fireEvent, screen } from "@testing-library/react-native";
import { toast } from "sonner-native";

import { renderScreen } from "~/test/render";
import { authClient } from "~/test/session-mock";

import { SignUpForm } from "./signup-form";

async function fill(email: string, password: string, confirm: string) {
  await fireEvent.changeText(screen.getByLabelText("Email"), email);
  await fireEvent.changeText(screen.getByLabelText("Password"), password);
  await fireEvent.changeText(
    screen.getByLabelText("Confirm password"),
    confirm,
  );
  await fireEvent.press(screen.getByRole("button", { name: "Sign up" }));
}

describe("SignUpForm", () => {
  it("explains the password rules before anything is typed", async () => {
    await renderScreen(<SignUpForm />);

    expect(
      screen.getByText(
        "At least 8 characters with upper and lower case, a number and a symbol.",
      ),
    ).toBeOnTheScreen();
  });

  it("shows every field's message and sends nothing", async () => {
    await renderScreen(<SignUpForm />);

    await fireEvent.press(screen.getByRole("button", { name: "Sign up" }));

    expect(screen.getByText("Email is Required")).toBeOnTheScreen();
    expect(screen.getByText("Password is Required")).toBeOnTheScreen();
    expect(screen.getByText("Please confirm your password")).toBeOnTheScreen();
    expect(authClient.signUp.email).not.toHaveBeenCalled();
  });

  it("names the first rule a weak password breaks", async () => {
    await renderScreen(<SignUpForm />);

    await fill("listener@example.com", "alllowercase1!", "alllowercase1!");

    expect(
      screen.getByText("Password must contain at least one uppercase letter."),
    ).toBeOnTheScreen();
    expect(authClient.signUp.email).not.toHaveBeenCalled();
  });

  it("catches a confirmation that does not match", async () => {
    await renderScreen(<SignUpForm />);

    await fill("listener@example.com", "Secret#123", "Secret#124");

    expect(screen.getByText("Passwords do not match")).toBeOnTheScreen();
    expect(authClient.signUp.email).not.toHaveBeenCalled();
  });

  it("creates the account, naming it after the email, with no redirect target", async () => {
    await renderScreen(<SignUpForm />);

    await fill("listener@example.com", "Secret#123", "Secret#123");

    expect(authClient.signUp.email).toHaveBeenCalledTimes(1);
    expect(authClient.signUp.email).toHaveBeenCalledWith({
      email: "listener@example.com",
      password: "Secret#123",
      name: "listener",
    });
    expect(toast.success).toHaveBeenCalledWith("Account Created Successfully");
  });

  it("shows the server's message when the email is taken", async () => {
    authClient.signUp.email.mockResolvedValueOnce({
      error: {
        status: 422,
        message: "User already exists. Use another email.",
      },
    });
    await renderScreen(<SignUpForm />);

    await fill("listener@example.com", "Secret#123", "Secret#123");

    expect(toast.error).toHaveBeenCalledWith(
      "User already exists. Use another email.",
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("asks the password manager to choose a new password", async () => {
    await renderScreen(<SignUpForm />);

    expect(screen.getByLabelText("Password").props).toMatchObject({
      textContentType: "newPassword",
      autoComplete: "new-password",
    });
  });
});
