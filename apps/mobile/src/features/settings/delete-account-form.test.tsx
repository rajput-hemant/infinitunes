import { fireEvent, screen } from "@testing-library/react-native";
import { toast } from "sonner-native";

import { authClient } from "~/features/auth/auth-client-mock";
import { queryClient } from "~/lib/query-client";
import { renderScreen } from "~/test/render";

import { DELETE_CONFIRMATION, DeleteAccountForm } from "./delete-account-form";
import { trpcClient, trpcError } from "./trpc-mock";

jest.mock("~/lib/auth-client", () =>
  require("~/features/auth/auth-client-mock"),
);
jest.mock("~/lib/trpc", () => require("~/features/settings/trpc-mock"));

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
    expect(trpcClient.user.deleteUser.mutate).not.toHaveBeenCalled();
  });

  it("deletes the account, signs out and forgets the library", async () => {
    await renderScreen(<DeleteAccountForm />);

    await fireEvent.changeText(
      screen.getByLabelText("Your password"),
      "Secret#123",
    );
    await confirm();
    await fireEvent.press(deleteButton());

    expect(trpcClient.user.deleteUser.mutate).toHaveBeenCalledWith({
      password: "Secret#123",
    });
    expect(authClient.signOut).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData(FAVORITES_KEY)).toBeUndefined();
    expect(toast.success).toHaveBeenCalledWith("Account Deleted!");
  });

  it("sends no password for an account that has none", async () => {
    await renderScreen(<DeleteAccountForm />);

    await confirm();
    await fireEvent.press(deleteButton());

    expect(trpcClient.user.deleteUser.mutate).toHaveBeenCalledWith({
      password: undefined,
    });
  });

  it("keeps the account, and the library, when the server refuses", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    trpcClient.user.deleteUser.mutate.mockRejectedValueOnce(
      trpcError("Please sign in again to continue", "UNAUTHORIZED"),
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
