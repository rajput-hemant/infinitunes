import { fireEvent, screen } from "@testing-library/react-native";

import {
  procedure,
  rawChart,
  renderScreenAt,
} from "~/features/browse/test-support";

import { TopChartsScreen } from "./top-charts-screen";

jest.mock(
  "~/lib/trpc",
  () => require("~/features/browse/test-support").trpcMock,
);
jest.mock("~/components/ui/skeleton", () =>
  require("~/features/browse/skeleton-mock"),
);

const charts = procedure("get.charts");

describe("TopChartsScreen", () => {
  it("shows a skeleton under the intro while charts load", async () => {
    charts.mockReturnValue(new Promise(() => {}));
    await renderScreenAt(<TopChartsScreen />);

    expect(screen.getAllByLabelText("Loading").length).toBeGreaterThan(0);
    expect(screen.getByText("Updated every Friday.")).toBeOnTheScreen();
  });

  it("lists each chart once, with decoded titles", async () => {
    charts.mockResolvedValue([
      rawChart(),
      rawChart(),
      rawChart({ id: "chart-2", title: "Weekly Top 10" }),
    ]);
    await renderScreenAt(<TopChartsScreen />);

    expect(await screen.findByText("Top 15 Hindi & Punjabi")).toBeOnTheScreen();
    expect(screen.getAllByText("Top 15 Hindi & Punjabi")).toHaveLength(1);
    expect(screen.getByText("Weekly Top 10")).toBeOnTheScreen();
    expect(screen.getByText("You have seen it all")).toBeOnTheScreen();
  });

  it("says so when there are no charts", async () => {
    charts.mockResolvedValue([]);
    await renderScreenAt(<TopChartsScreen />);

    expect(await screen.findByText("No charts yet")).toBeOnTheScreen();
  });

  it("offers a retry after a failed load", async () => {
    charts.mockRejectedValueOnce(new Error("upstream down"));
    charts.mockResolvedValue([rawChart()]);
    await renderScreenAt(<TopChartsScreen />);

    await fireEvent.press(await screen.findByText("Try again"));

    expect(await screen.findByText("Top 15 Hindi & Punjabi")).toBeOnTheScreen();
  });
});
