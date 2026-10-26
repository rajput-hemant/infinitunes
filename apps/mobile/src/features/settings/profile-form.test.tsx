import { fireEvent, screen } from "@testing-library/react-native";
import { TextInput } from "react-native";

import { renderScreen } from "~/test/render";
import { authClient } from "~/test/session-mock";
import { procedure, trpcError } from "~/test/trpc-mock";

import { ProfileForm } from "./profile-form";

const user = { name: "Listener", email: "listener@example.com" };
/** `focus()` on a text input is a shared mock under Jest; its `this` says which field. */
const focus = TextInput.prototype.focus as unknown as jest.Mock<void, []>;
const focusedField = () =>
  (focus.mock.contexts.at(-1) as { props: { accessibilityLabel?: string } })
    ?.props.accessibilityLabel;
const save = () => screen.getByRole("button", { name: "Save profile" });

describe("ProfileForm", () => {
  it("starts from the account's name and email", async () => {
    await renderScreen(<ProfileForm user={user} />);

    expect(screen.getByLabelText("Name").props.value).toBe("Listener");
    expect(screen.getByLabelText("Email").props.value).toBe(
      "listener@example.com",
    );
    expect(screen.queryByLabelText("Current password")).toBeNull();
  });

  it("will not save an empty name", async () => {
    await renderScreen(<ProfileForm user={user} />);

    await fireEvent.changeText(screen.getByLabelText("Name"), "   ");
    await fireEvent.press(save());

    expect(screen.getByText("Name is Required")).toBeOnTheScreen();
    expect(procedure("user.updateUser")).not.toHaveBeenCalled();
  });

  it("saves a new name without touching the email, then refreshes the session", async () => {
    await renderScreen(<ProfileForm user={user} />);

    await fireEvent.changeText(screen.getByLabelText("Name"), "DJ Listener");
    await fireEvent.press(save());

    expect(procedure("user.updateUser")).toHaveBeenCalledWith({
      name: "DJ Listener",
    });
    expect(authClient.$store.notify).toHaveBeenCalledWith("$sessionSignal");
  });

  it("asks for the current password once the email changes, and starts the confirmed flow", async () => {
    await renderScreen(<ProfileForm user={user} />);

    await fireEvent.changeText(
      screen.getByLabelText("Email"),
      "new@example.com",
    );
    await fireEvent.changeText(
      screen.getByLabelText("Current password"),
      "Secret#123",
    );
    await fireEvent.press(save());

    expect(procedure("user.requestEmailChange")).toHaveBeenCalledWith({
      email: "new@example.com",
      currentPassword: "Secret#123",
    });
    // The name is unchanged and the email is never written by updateUser.
    expect(procedure("user.updateUser")).not.toHaveBeenCalled();
    expect(screen.getByText(/we sent it a link/)).toBeOnTheScreen();
    expect(authClient.$store.notify).toHaveBeenCalledWith("$sessionSignal");
  });

  it("checks the new email", async () => {
    await renderScreen(<ProfileForm user={user} />);

    await fireEvent.changeText(screen.getByLabelText("Email"), "nope");
    await fireEvent.press(save());

    expect(screen.getByText("Please enter a valid email")).toBeOnTheScreen();
    expect(procedure("user.updateUser")).not.toHaveBeenCalled();
  });

  it("keeps the session and the form when the email change is refused", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    procedure("user.requestEmailChange").mockRejectedValueOnce(
      trpcError(
        "PRECONDITION_FAILED",
        "Changing your email is not available right now",
      ),
    );
    await renderScreen(<ProfileForm user={user} />);

    await fireEvent.changeText(
      screen.getByLabelText("Email"),
      "taken@example.com",
    );
    await fireEvent.press(save());

    expect(authClient.$store.notify).not.toHaveBeenCalled();
    expect(screen.queryByText(/we sent it a link/)).toBeNull();
  });

  it("puts the cursor back in the email when a name-only save is refused", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    procedure("user.updateUser").mockRejectedValueOnce(
      trpcError("INTERNAL_SERVER_ERROR", "Try again"),
    );
    await renderScreen(<ProfileForm user={user} />);
    await fireEvent.changeText(screen.getByLabelText("Name"), "DJ Listener");
    focus.mockClear();

    await fireEvent.press(save());

    expect(focusedField()).toBe("Email");
  });

  it("puts the cursor in the current password when a new email is refused", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    procedure("user.requestEmailChange").mockRejectedValueOnce(
      trpcError("UNAUTHORIZED", "Wrong password"),
    );
    await renderScreen(<ProfileForm user={user} />);
    await fireEvent.changeText(
      screen.getByLabelText("Email"),
      "new@example.com",
    );
    focus.mockClear();

    await fireEvent.press(save());

    expect(focusedField()).toBe("Current password");
  });
});
