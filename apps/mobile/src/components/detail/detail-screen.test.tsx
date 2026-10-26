import { FlashList } from "@shopify/flash-list";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { fireEvent, screen, userEvent } from "@testing-library/react-native";
import { Stack } from "expo-router";
import { renderRouter } from "expo-router/testing-library";
import { Platform, Share, Text } from "react-native";

import {
  DetailScreen,
  useDetailListProps,
} from "~/components/detail/detail-screen";
import { art } from "~/theme/tokens";

type Page = { name: string };

const answer = jest.fn(async (): Promise<Page | null> => ({
  name: "Udta Teer",
}));

/** A `list` page: its own virtualized list is the scroll view. */
function PageList({ name }: Page) {
  return (
    <FlashList
      testID="page-list"
      data={[name]}
      renderItem={({ item }) => <Text>{`Page of ${item}`}</Text>}
      {...useDetailListProps()}
    />
  );
}

function Harness({ list = false }: { list?: boolean }) {
  const query = useQuery({ queryKey: ["page"], queryFn: answer });
  return (
    <DetailScreen
      query={query}
      list={list}
      skeleton={<Text>Skeleton</Text>}
      noun="Album"
      identity={({ name }) => ({
        name,
        type: "album",
        url: "https://www.jiosaavn.com/album/udta-teer/LHgqn,SRpyA_",
      })}
    >
      {({ name }) =>
        list ? <PageList name={name} /> : <Text>{`Page of ${name}`}</Text>
      }
    </DetailScreen>
  );
}

function renderHarness(list = false) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return renderRouter({
    _layout: () => <Stack />,
    index: () => (
      <QueryClientProvider client={queryClient}>
        <Harness list={list} />
      </QueryClientProvider>
    ),
  });
}

type Node = ReturnType<typeof screen.getByText>;

function find(node: Node, type: string): Node | undefined {
  if (node.type === type) return node;
  for (const child of node.children) {
    const found = typeof child === "string" ? undefined : find(child, type);
    if (found) return found;
  }
  return undefined;
}

/** The native header's config, as the screen hands it to the platform. */
function header() {
  let root = screen.getByText("Page of Udta Teer");
  while (root.parent) root = root.parent;
  const config = find(root, "RNSScreenStackHeaderConfig");
  if (!config) throw new Error("No native header");
  return config.props as { title?: string; backgroundColor?: string };
}

async function scrollTo(y: number) {
  let view = screen.getByText("Page of Udta Teer");
  while (view.type !== "RCTScrollView" && view.parent) view = view.parent;
  await fireEvent.scroll(view, {
    nativeEvent: { contentOffset: { x: 0, y } },
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

    expect(await screen.findByText("Album not found")).toBeOnTheScreen();
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

  it("lets a list page be the scroll view, refreshed by a pull", async () => {
    await renderHarness(true);
    await screen.findByText("Page of Udta Teer");
    answer.mockResolvedValueOnce({ name: "Updated" });

    await userEvent.setup().pullToRefresh(screen.getByTestId("page-list"));

    expect(await screen.findByText("Page of Updated")).toBeOnTheScreen();
  });

  describe("on Android", () => {
    beforeEach(() => jest.replaceProperty(Platform, "OS", "android"));
    afterEach(() => jest.restoreAllMocks());

    it("tints and titles the bar once the header scrolls under it", async () => {
      await renderHarness();
      await screen.findByText("Page of Udta Teer");
      const surface = header().backgroundColor;
      expect(header().title).toBe("");

      await scrollTo(art.header / 2);
      expect(header().title).toBe("");

      await scrollTo(art.header + 1);
      expect(header().title).toBe("Udta Teer");
      expect(header().backgroundColor).not.toBe(surface);

      await scrollTo(0);
      expect(header().title).toBe("");
      expect(header().backgroundColor).toBe(surface);
    });
  });
});
