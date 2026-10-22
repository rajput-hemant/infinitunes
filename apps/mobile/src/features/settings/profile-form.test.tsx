import { fireEvent, screen } from "@testing-library/react-native";

import { renderScreen } from "~/test/render";
import { authClient } from "~/test/session-mock";
import { procedure, trpcError } from "~/test/trpc-mock";

import { ProfileForm } from "./profile-form";

const user = { name: "Listener", email: "listener@example.com" };
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

  it("asks for the current password once the email changes, and sends it", async () => {
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

    expect(procedure("user.updateUser")).toHaveBeenCalledWith({
      name: "Listener",
      email: "new@example.com",
      currentPassword: "Secret#123",
    });
  });

  it("checks the new email", async () => {
    await renderScreen(<ProfileForm user={user} />);

    await fireEvent.changeText(screen.getByLabelText("Email"), "nope");
    await fireEvent.press(save());

    expect(screen.getByText("Please enter a valid email")).toBeOnTheScreen();
    expect(procedure("user.updateUser")).not.toHaveBeenCalled();
  });

  it("keeps the session when the email is taken", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    procedure("user.updateUser").mockRejectedValueOnce(
      trpcError("CONFLICT", "That email is already in use"),
    );
    await renderScreen(<ProfileForm user={user} />);

    await fireEvent.changeText(
      screen.getByLabelText("Email"),
      "taken@example.com",
    );
    await fireEvent.press(save());

    expect(authClient.$store.notify).not.toHaveBeenCalled();
  });
});
