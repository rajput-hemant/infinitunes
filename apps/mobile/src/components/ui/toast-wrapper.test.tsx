import { render } from "@testing-library/react-native";
import { AccessibilityInfo, Text } from "react-native";

import { AnnouncingToast } from "./toast-wrapper";

/** A stand-in for sonner-native's `Toast`, which carries its words as props. */
function FakeToast({ title }: { title: string; description?: string }) {
  return <Text>{title}</Text>;
}

describe("AnnouncingToast (VoiceOver)", () => {
  const announce = jest.spyOn(
    AccessibilityInfo,
    "announceForAccessibilityWithOptions",
  );

  beforeEach(() => announce.mockImplementation(() => {}));

  it("announces a toast's title and description once", async () => {
    if (!AnnouncingToast) throw new Error("iOS announces toasts");
    const toast = (
      <AnnouncingToast toastId="1">
        <FakeToast title="Playlist deleted" description="You can undo this." />
      </AnnouncingToast>
    );
    const { rerender } = await render(toast);
    await rerender(toast);

    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith(
      "Playlist deleted. You can undo this.",
      { queue: true },
    );
  });

  it("announces again when a promise toast changes its text", async () => {
    if (!AnnouncingToast) throw new Error("iOS announces toasts");
    const { rerender } = await render(
      <AnnouncingToast toastId="1">
        <FakeToast title="Downloading" />
      </AnnouncingToast>,
    );
    await rerender(
      <AnnouncingToast toastId="1">
        <FakeToast title="Download ready" />
      </AnnouncingToast>,
    );

    expect(announce.mock.calls.map(([text]) => text)).toEqual([
      "Downloading",
      "Download ready",
    ]);
  });
});
