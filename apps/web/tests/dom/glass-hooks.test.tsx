import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { useScrollEdge } from "../../hooks/use-scroll-edge";
import { useTabBarMinimize } from "../../hooks/use-tab-bar-minimize";

const roots: Root[] = [];
const html = document.documentElement;

async function mount(ui: React.ReactElement) {
  const container = document.createElement("div");
  document.body.append(container);
  const reactRoot = createRoot(container);
  roots.push(reactRoot);
  await act(async () => {
    reactRoot.render(ui);
  });
  return container;
}

function scrollTo(y: number) {
  Object.defineProperty(window, "scrollY", { value: y, configurable: true });
  window.dispatchEvent(new Event("scroll"));
}

let wide = false;
const widthListeners = new Set<() => void>();

beforeEach(() => {
  wide = false;
  widthListeners.clear();
  Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
  window.matchMedia = (query: string) =>
    ({
      get matches() {
        return query.includes("min-width") ? wide : false;
      },
      media: query,
      addEventListener: (_: string, listener: () => void) =>
        widthListeners.add(listener),
      removeEventListener: (_: string, listener: () => void) =>
        widthListeners.delete(listener),
    }) as MediaQueryList;
});

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
  document.body.replaceChildren();
  html.removeAttribute("data-tab-min");
});

function TabBar({ onNavigate }: { onNavigate?: () => void }) {
  useTabBarMinimize();
  return (
    <nav data-glass-role="tabbar">
      <a href="#home" data-glass-item="" onClick={onNavigate}>
        Home
      </a>
    </nav>
  );
}

describe("useTabBarMinimize", () => {
  it("minimizes after scrolling down and expands after scrolling up", async () => {
    await mount(<TabBar />);
    for (const y of [20, 40, 60, 80]) scrollTo(y);
    expect(html.getAttribute("data-tab-min")).toBe("true");
    scrollTo(30);
    expect(html.hasAttribute("data-tab-min")).toBe(false);
  });

  it("does not minimize on a wide viewport", async () => {
    wide = true;
    await mount(<TabBar />);
    for (const y of [20, 40, 60, 80, 120]) scrollTo(y);
    expect(html.hasAttribute("data-tab-min")).toBe(false);
  });

  it("expands on a tap of the minimized bar instead of navigating", async () => {
    let navigated = 0;
    const container = await mount(<TabBar onNavigate={() => navigated++} />);
    for (const y of [20, 40, 60, 80]) scrollTo(y);
    expect(html.getAttribute("data-tab-min")).toBe("true");
    const link = container.querySelector("a");
    await act(async () => {
      link?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    });
    expect(html.hasAttribute("data-tab-min")).toBe(false);
    expect(navigated).toBe(0);
    await act(async () => {
      link?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    });
    expect(navigated).toBe(1);
  });

  it("clears the attribute and stops listening on unmount", async () => {
    await mount(<TabBar />);
    for (const y of [20, 40, 60, 80]) scrollTo(y);
    await act(async () => roots.splice(0).forEach((r) => r.unmount()));
    expect(html.hasAttribute("data-tab-min")).toBe(false);
    for (const y of [120, 160, 200]) scrollTo(y);
    expect(html.hasAttribute("data-tab-min")).toBe(false);
  });
});

function Toolbar() {
  const ref = useScrollEdge<HTMLDivElement>();
  return <div ref={ref} data-glass-edge="top" />;
}

describe("useScrollEdge", () => {
  it("sets data-scrolled once the page scrolls past the threshold", async () => {
    const container = await mount(<Toolbar />);
    const edge = container.querySelector<HTMLElement>("[data-glass-edge]");
    expect(edge?.dataset.scrolled).toBe("false");
    scrollTo(10);
    expect(edge?.dataset.scrolled).toBe("true");
    scrollTo(0);
    expect(edge?.dataset.scrolled).toBe("false");
  });

  it("starts scrolled when mounted mid-page", async () => {
    scrollTo(300);
    const container = await mount(<Toolbar />);
    expect(
      container.querySelector<HTMLElement>("[data-glass-edge]")?.dataset
        .scrolled,
    ).toBe("true");
  });

  it("does not re-render React while scrolling", async () => {
    let renders = 0;
    function Counted() {
      renders++;
      const ref = useScrollEdge<HTMLDivElement>();
      return <div ref={ref} />;
    }
    await mount(<Counted />);
    const before = renders;
    for (const y of [5, 50, 500, 5, 0]) scrollTo(y);
    expect(renders).toBe(before);
  });
});
