import { afterEach, beforeEach, describe, expect, it } from "bun:test";

import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";

import { GlassSelector } from "../../components/glass/glass-selector";
import { resetGlassRegistry } from "../../components/glass/lens-registry";

const roots: Root[] = [];
const html = document.documentElement;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Items are 80px wide, laid out by their index; happy-dom has no layout. */
function stubLayout() {
  const define = (name: string, read: (el: HTMLElement) => number) =>
    Object.defineProperty(HTMLElement.prototype, name, {
      configurable: true,
      get(this: HTMLElement) {
        return read(this);
      },
    });
  const index = (el: HTMLElement) =>
    el.hasAttribute("data-glass-item") && el.parentElement
      ? [
          ...el.parentElement.querySelectorAll(":scope > [data-glass-item]"),
        ].indexOf(el)
      : -1;
  define("offsetLeft", (el) => Math.max(0, index(el)) * 80);
  define("offsetWidth", (el) =>
    el.hasAttribute("data-glass-item") ? 80 : 240,
  );
  define("offsetHeight", () => 40);
  define("offsetTop", () => 0);
}

beforeEach(() => {
  stubLayout();
  html.setAttribute("data-motion", "reduced");
});

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
  resetGlassRegistry();
  document.body.replaceChildren();
  html.removeAttribute("data-motion");
});

const LABELS = ["Home", "Search", "Library"];

function Tabs({
  onPick,
  initial = 0,
}: {
  onPick?: (item: HTMLElement) => void;
  initial?: number;
}) {
  const [active, setActive] = useState(initial);
  return (
    <GlassSelector aria-label="Tabs" onPick={onPick}>
      {LABELS.map((label, i) => (
        <button
          key={label}
          type="button"
          data-glass-item=""
          aria-current={i === active ? "page" : undefined}
          onClick={() => setActive(i)}
        >
          {label}
        </button>
      ))}
    </GlassSelector>
  );
}

async function mount(ui: React.ReactElement) {
  const container = document.createElement("div");
  document.body.append(container);
  const reactRoot = createRoot(container);
  roots.push(reactRoot);
  await act(async () => {
    reactRoot.render(ui);
  });
  const host = container.firstElementChild as HTMLElement;
  const indicator = host.querySelector<HTMLElement>("[data-glass-indicator]");
  if (!indicator) throw new Error("no indicator");
  return {
    host,
    indicator,
    items: [...host.querySelectorAll<HTMLElement>("[data-glass-item]")],
  };
}

/** `time` pins event.timeStamp (ms) so release velocity is deterministic. */
function mouse(type: string, clientX: number, time = 0) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX,
    button: 0,
  });
  Object.defineProperty(event, "timeStamp", { value: time });
  return event;
}

describe("GlassSelector", () => {
  it("marks its host, hides the indicator from assistive tech and keeps the items", async () => {
    const { host, indicator, items } = await mount(<Tabs />);
    expect(host.hasAttribute("data-glass-selector")).toBe(true);
    expect(host.getAttribute("aria-label")).toBe("Tabs");
    expect(indicator.getAttribute("aria-hidden")).toBe("true");
    expect(items.map((i) => i.textContent)).toEqual(LABELS);
  });

  it("places the indicator under the active item", async () => {
    const { indicator } = await mount(<Tabs initial={1} />);
    expect(indicator.style.transform).toBe("translateX(80px)");
    expect(indicator.style.width).toBe("80px");
  });

  it("follows the active item when it changes", async () => {
    const { indicator, items } = await mount(<Tabs />);
    expect(indicator.style.transform).toBe("translateX(0px)");
    await act(async () => items[2].click());
    await act(async () => wait(20));
    expect(indicator.style.transform).toBe("translateX(160px)");
  });

  it("hides the indicator when nothing is active", async () => {
    const { indicator } = await mount(<Tabs initial={-1} />);
    expect(indicator.style.opacity).toBe("0");
  });

  it("lifts into a droplet while the active item is pressed, then settles", async () => {
    const { indicator, items } = await mount(<Tabs />);
    items[0].dispatchEvent(mouse("pointerdown", 40));
    expect(indicator.hasAttribute("data-lifted")).toBe(true);
    expect(indicator.style.transform).toContain("scale(1.14)");
    items[0].dispatchEvent(mouse("pointerup", 40));
    await wait(260);
    expect(indicator.hasAttribute("data-lifted")).toBe(false);
  });

  it("drags past the threshold and commits the nearest item on release", async () => {
    const picked: string[] = [];
    const { host, indicator, items } = await mount(
      <Tabs onPick={(item) => picked.push(item.textContent ?? "")} />,
    );
    items[0].dispatchEvent(mouse("pointerdown", 40, 0));
    host.dispatchEvent(mouse("pointermove", 44, 100));
    expect(indicator.style.transform).not.toContain("44");
    host.dispatchEvent(mouse("pointermove", 140, 1000));
    expect(indicator.style.transform).toContain("translateX(100px)");
    host.dispatchEvent(mouse("pointerup", 140, 1000));
    await act(async () => wait(1200));
    expect(picked).toEqual(["Search"]);
    expect(indicator.hasAttribute("data-lifted")).toBe(false);
  });

  it("rubber bands past the ends instead of following the pointer 1:1", async () => {
    const { host, indicator, items } = await mount(<Tabs />);
    items[0].dispatchEvent(mouse("pointerdown", 40));
    host.dispatchEvent(mouse("pointermove", 600));
    const x = Number(
      /translateX\(([\d.-]+)px\)/.exec(indicator.style.transform)?.[1],
    );
    // Max is 160; a pull of 560px past the start lands well short of 560.
    expect(x).toBeGreaterThan(160);
    expect(x).toBeLessThan(560);
    host.dispatchEvent(mouse("pointerup", 600));
    await act(async () => wait(1200));
  });

  it("swallows the click that follows a drag release", async () => {
    let clicks = 0;
    const picked: HTMLElement[] = [];
    const { host, items } = await mount(
      <Tabs onPick={(i) => picked.push(i)} />,
    );
    items[2].addEventListener("click", () => clicks++);
    items[0].dispatchEvent(mouse("pointerdown", 40));
    host.dispatchEvent(mouse("pointermove", 200));
    host.dispatchEvent(mouse("pointerup", 200));
    items[2].dispatchEvent(mouse("click", 200));
    expect(clicks).toBe(0);
    await act(async () => wait(1200));
  });
});
