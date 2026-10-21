import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { fireEvent, screen, userEvent } from "@testing-library/react-native";
import { Stack } from "expo-router";
import { renderRouter } from "expo-router/testing-library";
import { Share, Text } from "react-native";

import { DetailScreen } from "./detail-screen";

type Page = { name: string };

const answer = jest.fn(async (): Promise<Page | null> => ({
  name: "Udta Teer",
}));

function Harness() {
  const query = useQuery({ queryKey: ["page"], queryFn: answer });
  return (
    <DetailScreen
      query={query}
      skeleton={<Text>Skeleton</Text>}
      noun="album"
      identity={({ name }) => ({
        name,
        url: "https://www.jiosaavn.com/album/udta-teer/LHgqn,SRpyA_",
      })}
    >
      {({ name }) => <Text>{`Page of ${name}`}</Text>}
    </DetailScreen>
  );
}

function renderHarness() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return renderRouter({
    _layout: () => <Stack />,
    index: () => (
      <QueryClientProvider client={queryClient}>
        <Harness />
      </QueryClientProvider>
    ),
  });
}

describe("DetailScreen", () => {
  it("shows the skeleton, then the page", async () => {
    await renderHarness();

    expect(screen.getByText("Skeleton")).toBeOnTheScreen();
    expect(await screen.findByText("Page of Udta Teer")).toBeOnTheScreen();
    expect(screen.queryByText("Skeleton")).toBeNull();
  });

  it("treats a null page as missing", async () => {
    answer.mockResolvedValueOnce(null);
    await renderHarness();

    expect(
      await screen.findByText("Couldn't find this album"),
    ).toBeOnTheScreen();
  });

  it("shares the item's web page from the header", async () => {
    const share = jest.spyOn(Share, "share").mockResolvedValue({
      action: "dismissedAction",
      activityType: undefined,
    });
    await renderHarness();
    await screen.findByText("Page of Udta Teer");

    await fireEvent.press(
      await screen.findByRole("button", { name: "Share Udta Teer" }),
    );

    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://infinitunes.test/album/udta-teer/LHgqn,SRpyA_",
      }),
    );
  });

  it("refetches the page on pull to refresh", async () => {
    await renderHarness();
    await screen.findByText("Page of Udta Teer");
    answer.mockResolvedValueOnce({ name: "Updated" });

    await userEvent
      .setup()
      .pullToRefresh(screen.getByText("Page of Udta Teer").parent!.parent!);

    expect(await screen.findByText("Page of Updated")).toBeOnTheScreen();
  });
});
