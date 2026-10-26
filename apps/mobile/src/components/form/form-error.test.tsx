import { renderHook, screen } from "@testing-library/react-native";
import { notificationAsync } from "expo-haptics";

import { renderWithProviders } from "~/test/render";

import { FormError, useFocusOnRefusal } from "./form-error";
import type { TextInputHandle } from "./form-field";

describe("FormError", () => {
  it("buzzes for a new refusal, never for a restored error on mount", async () => {
    const view = await renderWithProviders(
      <FormError message="Wrong password" />,
    );
    expect(notificationAsync).not.toHaveBeenCalled();

    await view.rerender(<FormError />);
    await view.rerender(<FormError message="Wrong password" />);
    expect(notificationAsync).toHaveBeenCalledTimes(1);
    expect(notificationAsync).toHaveBeenCalledWith("error");

    await view.rerender(<FormError message="Wrong password" />);
    expect(notificationAsync).toHaveBeenCalledTimes(1);
  });
  it("is an alert with the message, and nothing without one", async () => {
    const view = await renderWithProviders(
      <FormError message="Wrong password" />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Wrong password");

    await view.rerender(<FormError />);
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("useFocusOnRefusal", () => {
  it("focuses the field once the refused request has finished", async () => {
    const focus = jest.fn();
    const field = { current: { focus } as unknown as TextInputHandle };
    const hook = await renderHook(
      ({ message, pending }: { message?: string; pending: boolean }) =>
        useFocusOnRefusal(field, message, pending),
      { initialProps: { pending: true } },
    );

    await hook.rerender({ message: "Wrong password", pending: true });
    expect(focus).not.toHaveBeenCalled();

    await hook.rerender({ message: "Wrong password", pending: false });
    expect(focus).toHaveBeenCalledTimes(1);
  });
});
