import { describe, expect, it } from "bun:test";

const ROOT_LAYOUT = new URL("../app/(root)/layout.tsx", import.meta.url);
const QUEUE = new URL("../components/queue.tsx", import.meta.url);

describe("docked queue layout", () => {
  it("reserves the pane column on the wrapper holding toolbar and main", async () => {
    const layout = await Bun.file(ROOT_LAYOUT).text();
    const reserve = "min-[1440px]:in-data-[queue=open]:mr-(--queue-w)";
    const wrapperAt = layout.indexOf(
      '<div className="flex min-w-0 flex-1 flex-col',
    );

    expect(layout.split(reserve)).toHaveLength(2);
    expect(layout.indexOf(reserve)).toBeGreaterThan(wrapperAt);
    expect(layout.indexOf(reserve)).toBeLessThan(layout.indexOf("<Navbar />"));
  });

  it("scopes the floating md geometry below 1440 so the docked column wins", async () => {
    const queue = await Bun.file(QUEUE).text();

    expect(queue).not.toMatch(/"md:(bottom|left|h|w)-/);
    expect(queue).not.toMatch(/\smd:(bottom|left|h|w)-/);
    expect(queue).toContain("md:max-[1439px]:bottom-23");
    expect(queue).toContain("min-[1440px]:inset-y-2");
    expect(queue).toContain("min-[1440px]:left-auto");
  });
});
