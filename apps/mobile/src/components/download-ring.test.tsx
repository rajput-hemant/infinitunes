import { act, screen } from "@testing-library/react-native";

import {
  cancelDownloads,
  downloadStore,
  setSongProgress,
  startBatch,
  startSong,
} from "~/lib/download-store";
import { renderWithProviders } from "~/test/render";

import { DownloadMark } from "./download-ring";

afterEach(() => {
  cancelDownloads();
  downloadStore.setState({ queued: {}, active: {}, batch: null });
});

describe("DownloadMark", () => {
  it("draws nothing for a song that is not downloading", async () => {
    await renderWithProviders(<DownloadMark id="a" />);

    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.queryByLabelText("Waiting to download")).toBeNull();
  });

  it("rings only the row of the song that transfers, and marks the others as waiting", async () => {
    await renderWithProviders(
      <>
        <DownloadMark id="a" />
        <DownloadMark id="b" />
        <DownloadMark id="c" />
      </>,
    );

    await act(async () => {
      const signal = startBatch(["a", "b"], 2);
      startSong("a", signal);
      setSongProgress("a", 0.5);
    });

    const ring = screen.getByRole("progressbar", { name: "Downloading" });
    expect(ring).toHaveProp("accessibilityValue", {
      min: 0,
      max: 100,
      now: 50,
    });
    expect(screen.getAllByRole("progressbar")).toHaveLength(1);
    // `b` waits; `c` is not part of the run.
    expect(screen.getAllByLabelText("Waiting to download")).toHaveLength(1);
  });
});
