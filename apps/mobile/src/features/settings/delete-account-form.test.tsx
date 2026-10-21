import { fireEvent, screen } from "@testing-library/react-native";
import { toast } from "sonner-native";

import { queryClient } from "~/lib/query-client";
import { renderScreen } from "~/test/render";
import { authClient, signInAs } from "~/test/session-mock";
import { procedure, trpcError } from "~/test/trpc-mock";

import { DELETE_CONFIRMATION, DeleteAccountForm } from "./delete-account-form";

const FAVORITES_KEY = [["user", "getUserFavorites"], { type: "query" }, "u1"];

const deleteButton = () =>
  screen.getByRole("button", { name: "Delete account" });

async function confirm() {
  await fireEvent.changeText(
    screen.getByLabelText(`Type ${DELETE_CONFIRMATION} to confirm`),
    DELETE_CONFIRMATION,
  );
}

// The app's own client schedules cache-collection timers that outlive a test.
afterAll(() => queryClient.clear());

beforeEach(() => {
  queryClient.clear();
  queryClient.setQueryData(FAVORITES_KEY, { song: ["a"] });
});

describe("DeleteAccountForm", () => {
  it("stays disabled until the confirmation phrase is typed exactly", async () => {
    await renderScreen(<DeleteAccountForm />);
    expect(deleteButton()).toBeDisabled();

    await fireEvent.changeText(
      screen.getByLabelText(`Type ${DELETE_CONFIRMATION} to confirm`),
      "delete my account",
    );
    expect(deleteButton()).toBeDisabled();

    await confirm();
    expect(deleteButton()).toBeEnabled();
    expect(procedure("user.deleteUser")).not.toHaveBeenCalled();
  });

  it("deletes the account, signs out and forgets the library", async () => {
    await renderScreen(<DeleteAccountForm />);

    await fireEvent.changeText(
      screen.getByLabelText("Your password"),
      "Secret#123",
    );
    await confirm();
    await fireEvent.press(deleteButton());

    expect(procedure("user.deleteUser")).toHaveBeenCalledWith({
      password: "Secret#123",
    });
    expect(authClient.signOut).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData(FAVORITES_KEY)).toBeUndefined();
    expect(toast.success).toHaveBeenCalledWith("Account deleted");
  });

  it("reports the deletion when a failed sign-out already cleared the device", async () => {
    signInAs("u1");
    // Better Auth's expo client drops the stored cookie before it sends /sign-out.
    authClient.signOut.mockImplementationOnce(async () => {
      signInAs(null);
      return { error: { status: 503 } };
    });
    await renderScreen(<DeleteAccountForm />);

    await confirm();
    await fireEvent.press(deleteButton());

    expect(queryClient.getQueryData(FAVORITES_KEY)).toBeUndefined();
    expect(authClient.$store.notify).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Account deleted");
  });

  it("forgets the library and re-reads the session when the stored cookie survives a failed sign-out", async () => {
    signInAs("u1");
    authClient.signOut.mockResolvedValueOnce({ error: { status: 503 } });
    await renderScreen(<DeleteAccountForm />);

    await confirm();
    await fireEvent.press(deleteButton());

    expect(queryClient.getQueryData(FAVORITES_KEY)).toBeUndefined();
    expect(authClient.$store.notify).toHaveBeenCalledWith("$sessionSignal");
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.warning).toHaveBeenCalledWith(
      "Account deleted, but this device couldn't finish signing out. If your account still shows, sign out in Settings.",
    );
  });

  it("sends no password for an account that has none", async () => {
    await renderScreen(<DeleteAccountForm />);

    await confirm();
    await fireEvent.press(deleteButton());

    expect(procedure("user.deleteUser")).toHaveBeenCalledWith({
      password: undefined,
    });
  });

  it("keeps the account, and the library, when the server refuses", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    procedure("user.deleteUser").mockRejectedValueOnce(
      trpcError("UNAUTHORIZED", "Please sign in again to continue"),
    );
    await renderScreen(<DeleteAccountForm />);

    await confirm();
    await fireEvent.press(deleteButton());

    expect(toast.error).toHaveBeenCalledWith(
      "Please sign in again to continue",
    );
    expect(authClient.signOut).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(FAVORITES_KEY)).toEqual({ song: ["a"] });
  });
});
