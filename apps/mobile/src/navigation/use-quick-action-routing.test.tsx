import { act, renderHook } from "@testing-library/react-native";
import type * as QuickActions from "expo-quick-actions";

import { useQuickActionRouting } from "./use-quick-action-routing";

const mockNavigate = jest.fn();
let mockRouter = { navigate: mockNavigate };
jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
}));

let mockInitial: QuickActions.Action | undefined;
let mockListener: ((action: QuickActions.Action) => void) | undefined;
const mockRemove = jest.fn();
jest.mock("expo-quick-actions", () => ({
  get initial() {
    return mockInitial;
  },
  addListener: (listener: (action: QuickActions.Action) => void) => {
    mockListener = listener;
    return { remove: mockRemove };
  },
}));

const action = (href: unknown): QuickActions.Action => ({
  id: "x",
  title: "X",
  params: { href: href as string },
});

beforeEach(() => {
  jest.useFakeTimers();
  mockInitial = undefined;
  mockListener = undefined;
  mockRouter = { navigate: mockNavigate };
  mockNavigate.mockClear();
  mockRemove.mockClear();
});
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe("useQuickActionRouting", () => {
  it("opens the action the app was launched from, on the next tick", async () => {
    mockInitial = action("/library");
    await renderHook(() => useQuickActionRouting());

    expect(mockNavigate).not.toHaveBeenCalled();
    await act(async () => jest.runOnlyPendingTimers());
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/library");
  });

  it("handles the launch action once, even if the router object changes", async () => {
    mockInitial = action("/library");
    const { rerender } = await renderHook(() => useQuickActionRouting());
    await act(async () => jest.runOnlyPendingTimers());

    mockRouter = { navigate: mockNavigate };
    await rerender({});
    await act(async () => jest.runOnlyPendingTimers());

    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it("opens each action pressed while running, and ignores ones without an href", async () => {
    await renderHook(() => useQuickActionRouting());

    await act(async () => {
      mockListener?.(action("/search"));
      mockListener?.(action(undefined));
      mockListener?.(action(42));
      jest.runOnlyPendingTimers();
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/search");
  });

  it("stops listening when unmounted", async () => {
    const { unmount } = await renderHook(() => useQuickActionRouting());
    await unmount();
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });
});
