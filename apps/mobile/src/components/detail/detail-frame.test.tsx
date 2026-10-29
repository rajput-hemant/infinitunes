import { useQuery } from "@tanstack/react-query";
import { act, screen } from "@testing-library/react-native";
import { Platform, Text } from "react-native";

import { renderWithProviders } from "~/test/render";

import { DetailFrame } from "./detail-frame";

jest.mock("expo-router", () => ({
  ...jest.requireActual("expo-router"),
  Stack: { Screen: () => null },
}));

afterEach(() => jest.restoreAllMocks());

it.each(["android", "ios"] as const)(
  "mounts cached %s details at the right time",
  async (os) => {
    jest.replaceProperty(Platform, "OS", os);
    const frames: FrameRequestCallback[] = [];
    jest
      .spyOn(globalThis, "requestAnimationFrame")
      .mockImplementation((callback) => {
        frames.push(callback);
        return frames.length;
      });
    const content = jest.fn(() => <Text>Cached playlist</Text>);
    function Page() {
      const query = useQuery({
        queryKey: ["cached-detail"],
        queryFn: async () => ({ name: "Fresh Dance Hits" }),
        initialData: { name: "Fresh Dance Hits" },
        staleTime: Infinity,
      });
      return (
        <DetailFrame
          query={query}
          skeleton={<Text>Loading playlist</Text>}
          noun="Playlist"
          identity={(item) => ({
            name: item.name,
            type: "playlist",
            url: "https://example.com",
          })}
        >
          {content}
        </DetailFrame>
      );
    }
    await renderWithProviders(<Page />);
    if (os === "android") {
      expect(content).not.toHaveBeenCalled();
      expect(screen.getByText("Loading playlist")).toBeOnTheScreen();
      await act(() => frames.shift()?.(0));
      expect(content).not.toHaveBeenCalled();
      await act(() => frames.shift()?.(16));
    }
    expect(screen.getByText("Cached playlist")).toBeOnTheScreen();
  },
);
