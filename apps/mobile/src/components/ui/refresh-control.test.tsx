import { act, screen } from "@testing-library/react-native";

import { reportFailure } from "~/lib/failure";
import { renderWithProviders } from "~/test/render";

import { PullToRefresh } from "./refresh-control";

jest.mock("~/lib/failure", () => ({
  reportFailure: jest.fn(() => jest.fn()),
}));

// Jest's stock RefreshControl drops its props; keep them to read `refreshing`.
jest.mock(
  "react-native/Libraries/Components/RefreshControl/RefreshControl",
  () => {
    const { View } = require("react-native");
    return {
      __esModule: true,
      default: (props: object) => <View testID="refresh" {...props} />,
    };
  },
);

const control = () => screen.getByTestId("refresh");

describe("PullToRefresh", () => {
  it("is idle until the listener pulls", async () => {
    await renderWithProviders(<PullToRefresh onRefresh={async () => {}} />);
    expect(control().props.refreshing).toBe(false);
  });

  it("spins from the pull until the refetch settles", async () => {
    let settle!: () => void;
    const onRefresh = jest.fn(
      () => new Promise<void>((resolve) => (settle = resolve)),
    );
    await renderWithProviders(<PullToRefresh onRefresh={onRefresh} />);

    await act(async () => control().props.onRefresh());
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(control().props.refreshing).toBe(true);

    await act(async () => settle());
    expect(control().props.refreshing).toBe(false);
  });

  it("reports a rejected refresh instead of leaving it unhandled", async () => {
    const failure = jest.fn();
    jest.mocked(reportFailure).mockReturnValueOnce(failure);
    const error = new Error("offline");
    await renderWithProviders(
      <PullToRefresh onRefresh={() => Promise.reject(error)} />,
    );

    await act(async () => control().props.onRefresh());

    expect(reportFailure).toHaveBeenCalledWith("Couldn't refresh.");
    expect(failure).toHaveBeenCalledWith(error);
    expect(control().props.refreshing).toBe(false);
  });

  it("passes the rest of the props through to the control", async () => {
    await renderWithProviders(
      <PullToRefresh
        onRefresh={async () => {}}
        progressViewOffset={24}
        style={{ flex: 1 }}
      />,
    );
    expect(control().props.progressViewOffset).toBe(24);
    expect(control().props.style).toEqual({ flex: 1 });
  });
});
