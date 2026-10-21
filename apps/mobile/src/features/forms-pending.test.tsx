import { act, fireEvent, screen } from "@testing-library/react-native";
import type { ReactElement } from "react";

import { queryClient } from "~/lib/query-client";
import { renderScreen } from "~/test/render";
import { authClient, type AuthResult } from "~/test/session-mock";
import { procedure } from "~/test/trpc-mock";

import { ForgotPasswordForm } from "./auth/forgot-password-form";
import { ResetPasswordForm } from "./auth/reset-password-form";
import { SignUpForm } from "./auth/signup-form";
import {
  DELETE_CONFIRMATION,
  DeleteAccountForm,
} from "./settings/delete-account-form";
import { PasswordForm } from "./settings/password-form";
import { ProfileForm } from "./settings/profile-form";

// The app's own client schedules cache-collection timers that outlive a test.
afterAll(() => queryClient.clear());

/**
 * Every form that sends one request: pressing submit locks it (busy label,
 * disabled button, read-only fields), a second press sends nothing, and it
 * unlocks once the request settles, success or failure.
 */
type FormCase = {
  name: string;
  element: () => ReactElement;
  fill: () => Promise<void>;
  idle: string;
  busy: string;
  /** Holds the next request open; resolves with the outcome the test picks. */
  hold: () => {
    request: PromiseWithResolvers<AuthResult>;
    calls: () => number;
  };
  /** A field that is read-only while the request is in flight. */
  field: string;
};

/** The slice of a `jest.fn` this needs, whatever arguments the Better Auth call takes. */
type AuthCall = {
  mockReturnValueOnce: (value: Promise<AuthResult>) => unknown;
  mock: { calls: readonly unknown[] };
};

function holdAuth(call: AuthCall) {
  const request = Promise.withResolvers<AuthResult>();
  call.mockReturnValueOnce(request.promise);
  return { request, calls: () => call.mock.calls.length };
}

function holdProcedure(path: "user.changePassword" | "user.updateUser") {
  const request = Promise.withResolvers<AuthResult>();
  const call = procedure(path);
  call.mockReturnValueOnce(request.promise.then(() => undefined));
  return { request, calls: () => call.mock.calls.length };
}

const cases: FormCase[] = [
  {
    name: "SignUpForm",
    element: () => <SignUpForm />,
    fill: async () => {
      await fireEvent.changeText(
        screen.getByLabelText("Email"),
        "new@example.com",
      );
      await fireEvent.changeText(
        screen.getByLabelText("Password"),
        "Secret#123",
      );
      await fireEvent.changeText(
        screen.getByLabelText("Confirm password"),
        "Secret#123",
      );
    },
    idle: "Sign up",
    busy: "Creating account...",
    hold: () => holdAuth(authClient.signUp.email),
    field: "Email",
  },
  {
    name: "ForgotPasswordForm",
    element: () => <ForgotPasswordForm />,
    fill: async () => {
      await fireEvent.changeText(
        screen.getByLabelText("Email"),
        "listener@example.com",
      );
    },
    idle: "Send reset link",
    busy: "Sending...",
    hold: () => holdAuth(authClient.requestPasswordReset),
    field: "Email",
  },
  {
    name: "ResetPasswordForm",
    element: () => <ResetPasswordForm token="tok_123" linkError={undefined} />,
    fill: async () => {
      await fireEvent.changeText(
        screen.getByLabelText("New password"),
        "Secret#123",
      );
      await fireEvent.changeText(
        screen.getByLabelText("Confirm new password"),
        "Secret#123",
      );
    },
    idle: "Reset password",
    busy: "Resetting...",
    hold: () => holdAuth(authClient.resetPassword),
    field: "New password",
  },
  {
    name: "PasswordForm",
    element: () => <PasswordForm />,
    fill: async () => {
      await fireEvent.changeText(
        screen.getByLabelText("Current password"),
        "Old#Secret1",
      );
      await fireEvent.changeText(
        screen.getByLabelText("New password"),
        "New#Secret1",
      );
    },
    idle: "Update password",
    busy: "Updating...",
    hold: () => holdProcedure("user.changePassword"),
    field: "New password",
  },
  {
    name: "ProfileForm",
    element: () => (
      <ProfileForm user={{ name: "Listener", email: "listener@example.com" }} />
    ),
    fill: async () => {
      await fireEvent.changeText(screen.getByLabelText("Name"), "DJ Listener");
    },
    idle: "Save profile",
    busy: "Saving...",
    hold: () => holdProcedure("user.updateUser"),
    field: "Name",
  },
  {
    name: "DeleteAccountForm",
    element: () => <DeleteAccountForm />,
    fill: async () => {
      await fireEvent.changeText(
        screen.getByLabelText("Your password"),
        "Secret#123",
      );
      await fireEvent.changeText(
        screen.getByLabelText(`Type ${DELETE_CONFIRMATION} to confirm`),
        DELETE_CONFIRMATION,
      );
    },
    idle: "Delete account",
    busy: "Deleting...",
    hold: () => {
      const request = Promise.withResolvers<AuthResult>();
      const call = procedure("user.deleteUser");
      call.mockReturnValueOnce(request.promise.then(() => ({ id: "u1" })));
      return { request, calls: () => call.mock.calls.length };
    },
    field: "Your password",
  },
];

describe.each(cases)("$name while its request is in flight", (form) => {
  it("locks, ignores a second press, and unlocks when it settles", async () => {
    await renderScreen(form.element());
    await form.fill();
    const { request, calls } = form.hold();

    await fireEvent.press(screen.getByRole("button", { name: form.idle }));

    const busy = screen.getByRole("button", { name: form.busy });
    expect(busy).toBeDisabled();
    expect(screen.getByLabelText(form.field).props.editable).toBe(false);

    await fireEvent.press(busy);
    expect(calls()).toBe(1);

    await act(async () => request.resolve({ error: { status: 500 } }));

    expect(screen.queryByRole("button", { name: form.busy })).toBeNull();
    expect(calls()).toBe(1);
  });
});
