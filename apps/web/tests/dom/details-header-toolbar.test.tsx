import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "bun:test";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { DetailsHeaderFrame } from "../../components/details-header/details-header-frame";

type Reading = { isIntersecting: boolean; boundingClientRect: { top: number } };

type Callback = (entries: Reading[]) => void;

const observers: FakeIntersectionObserver[] = [];

class FakeIntersectionObserver {
  readonly observed: Element[] = [];
  disconnected = false;

  constructor(
    readonly callback: Callback,
    readonly options?: IntersectionObserverInit,
  ) {
    observers.push(this);
  }

  observe(target: Element) {
    this.observed.push(target);
  }

  disconnect() {
    this.disconnected = true;
  }

  unobserve() {}

  takeRecords() {
    return [];
  }
}

const originalObserver = Object.getOwnPropertyDescriptor(
  globalThis,
  "IntersectionObserver",
);

beforeEach(() => {
  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    value: FakeIntersectionObserver,
  });
});

const roots: Root[] = [];

function addToolbar(withSlot: boolean) {
  const toolbar = document.createElement("header");
  toolbar.dataset.glassEdge = "top";
  Object.defineProperty(toolbar, "offsetHeight", { value: 56 });
  if (withSlot) {
    const slot = document.createElement("div");
    slot.dataset.toolbarTitle = "";
    toolbar.append(slot);
  }
  document.body.append(toolbar);
  return toolbar;
}

async function mount(title: string) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(
      <DetailsHeaderFrame title={title} className="band">
        <h1>{title}</h1>
      </DetailsHeaderFrame>,
    );
  });
  return { container, root };
}

function latestObserver() {
  const observer = observers.at(-1);
  if (!observer) throw new Error("no observer was created");
  return observer;
}

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
  document.body.innerHTML = "";
  observers.length = 0;
});

afterAll(() => {
  if (originalObserver) {
    Object.defineProperty(globalThis, "IntersectionObserver", originalObserver);
  } else {
    Reflect.deleteProperty(globalThis, "IntersectionObserver");
  }
});

describe("details header toolbar signal", () => {
  it("renders the band as a figure with its content", async () => {
    addToolbar(false);
    const { container } = await mount("Tum Hi Ho");

    expect(container.querySelector("figure.band h1")?.textContent).toBe(
      "Tum Hi Ho",
    );
  });

  it("marks the toolbar over-art while the band is mounted and clears it on unmount", async () => {
    const toolbar = addToolbar(false);
    const { root } = await mount("Tum Hi Ho");

    expect(toolbar.hasAttribute("data-glass-over-art")).toBe(true);

    await act(async () => root.unmount());
    roots.splice(roots.indexOf(root), 1);

    expect(toolbar.hasAttribute("data-glass-over-art")).toBe(false);
    expect(latestObserver().disconnected).toBe(true);
  });

  it("observes the heading with the toolbar height as the top inset", async () => {
    addToolbar(false);
    await mount("Tum Hi Ho");

    const observer = latestObserver();
    expect(observer.observed[0]?.tagName).toBe("H1");
    expect(observer.options?.rootMargin).toBe("-56px 0px 0px 0px");
  });

  it("sets data-glass-titled when the heading scrolls under the toolbar and clears it when it returns", async () => {
    const toolbar = addToolbar(false);
    await mount("Tum Hi Ho");
    const { callback } = latestObserver();

    callback([{ isIntersecting: false, boundingClientRect: { top: -90 } }]);
    expect(toolbar.hasAttribute("data-glass-titled")).toBe(true);

    callback([{ isIntersecting: true, boundingClientRect: { top: 40 } }]);
    expect(toolbar.hasAttribute("data-glass-titled")).toBe(false);
  });

  it("shows the title in the toolbar slot as a hidden duplicate of the heading", async () => {
    addToolbar(true);
    await mount("Tum Hi Ho");

    const copy = document.querySelector<HTMLElement>("[data-toolbar-title]");
    const span = copy?.querySelector("span");
    expect(span?.textContent).toBe("Tum Hi Ho");
    expect(span?.getAttribute("aria-hidden")).toBe("true");
  });

  it("renders the band without a toolbar on the page", async () => {
    const { container } = await mount("Tum Hi Ho");

    expect(container.querySelector("h1")?.textContent).toBe("Tum Hi Ho");
    expect(observers).toHaveLength(0);
  });
});
