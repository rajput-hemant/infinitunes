import { fireEvent, screen } from "@testing-library/react-native";
import { toast } from "sonner-native";

import { authClient } from "~/features/auth/auth-client-mock";
import { renderScreen } from "~/test/render";

import { ProfileForm } from "./profile-form";
import { trpcClient, trpcError } from "./trpc-mock";

jest.mock("~/lib/auth-client", () =>
  require("~/features/auth/auth-client-mock"),
);
jest.mock("~/lib/trpc", () => require("~/features/settings/trpc-mock"));

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
    expect(trpcClient.user.updateUser.mutate).not.toHaveBeenCalled();
  });

  it("saves a new name without touching the email, then refreshes the session", async () => {
    await renderScreen(<ProfileForm user={user} />);

    await fireEvent.changeText(screen.getByLabelText("Name"), "DJ Listener");
    await fireEvent.press(save());

    expect(trpcClient.user.updateUser.mutate).toHaveBeenCalledWith({
      name: "DJ Listener",
    });
    expect(toast.success).toHaveBeenCalledWith("Profile Updated!");
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

    expect(trpcClient.user.updateUser.mutate).toHaveBeenCalledWith({
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
    expect(trpcClient.user.updateUser.mutate).not.toHaveBeenCalled();
  });

  it("shows the server's message when the email is taken", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    trpcClient.user.updateUser.mutate.mockRejectedValueOnce(
      trpcError("That email is already in use", "CONFLICT"),
    );
    await renderScreen(<ProfileForm user={user} />);

    await fireEvent.changeText(
      screen.getByLabelText("Email"),
      "taken@example.com",
    );
    await fireEvent.press(save());

    expect(toast.error).toHaveBeenCalledWith("That email is already in use");
    expect(toast.success).not.toHaveBeenCalled();
    expect(authClient.$store.notify).not.toHaveBeenCalled();
  });

  it("hides an upstream fault behind generic copy", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    trpcClient.user.updateUser.mutate.mockRejectedValueOnce(
      trpcError('relation "user" does not exist', "INTERNAL_SERVER_ERROR"),
    );
    await renderScreen(<ProfileForm user={user} />);

    await fireEvent.press(save());

    expect(toast.error).toHaveBeenCalledWith(
      "Something went wrong. Please try again.",
    );
  });
});
