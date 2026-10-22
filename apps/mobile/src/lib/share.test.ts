import { Share } from "react-native";

import { failureStore } from "./failure";
import { shareItem } from "./share";

const share = jest.spyOn(Share, "share").mockResolvedValue({
  action: Share.dismissedAction,
  activityType: undefined,
});

beforeEach(() => share.mockClear());

describe("shareItem", () => {
  it("says so when the share sheet cannot open", async () => {
    failureStore.setState({ current: null });
    share.mockRejectedValueOnce(new Error("no activity"));

    shareItem({ name: "A", type: "album", url: "https://www.jiosaavn.com/a" });
    await Promise.resolve();
    await Promise.resolve();

    expect(failureStore.getState().current?.message).toBe(
      "Couldn't open the share sheet.",
    );
  });

  it("shares the web page of an album, not JioSaavn's own URL", () => {
    shareItem({
      name: "Udta Teer",
      type: "album",
      url: "https://www.jiosaavn.com/album/udta-teer/LHgqn,SRpyA_",
    });

    expect(share).toHaveBeenCalledTimes(1);
    const [content] = share.mock.calls[0] ?? [];
    expect(content).toEqual({
      title: "Udta Teer",
      // Android reads only the message; iOS shares `url` as a link.
      message: `Udta Teer ${content?.url}`,
      url: expect.stringMatching(
        /^https:\/\/infinitunes\.test\/album\/udta-teer\/LHgqn/,
      ),
    });
    expect(content?.url).not.toContain("jiosaavn.com");
  });

  it("opens a station under /radio like the web", () => {
    shareItem({
      name: "Hindi Hits",
      type: "radio_station",
      url: "https://www.saavn.com/s/radio/hindi-featured-station/station-1",
    });

    expect(share.mock.calls[0]?.[0].url).toMatch(
      /^https:\/\/infinitunes\.test\/radio\/hindi-featured-station\/station-1/,
    );
  });

  it("keeps the perma URL's own path on the web origin when it is not an entity URL", () => {
    shareItem({
      name: "Somewhere",
      type: "album",
      url: "https://www.jiosaavn.com/featured?ref=1",
    });

    expect(share.mock.calls[0]?.[0]).toMatchObject({
      url: "https://infinitunes.test/featured?ref=1",
      message: "Somewhere https://infinitunes.test/featured?ref=1",
    });
  });
});
