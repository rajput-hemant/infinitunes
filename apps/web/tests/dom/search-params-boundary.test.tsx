import { afterEach, describe, expect, it, mock } from "bun:test";

import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";

// `useSearchParams` either suspends (the route is being prerendered and the
// query string is unknown) or returns the request's params.
let query: URLSearchParams | "pending" = "pending";
const pending = new Promise<never>(() => {});
const navigation = await import("next/navigation");
mock.module("next/navigation", () => ({
  ...navigation,
  useSearchParams: () => {
    if (query === "pending") throw pending;
    return query;
  },
}));
const { KeyedByParams, SearchParamsBoundary } =
  await import("../../components/search-params-boundary");
const { LanguageBar } = await import("../../components/language-bar");

const roots: Root[] = [];

async function mount(ui: React.ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => root.render(ui));
  return { container, root };
}

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
  document.body.replaceChildren();
  query = "pending";
});

describe("SearchParamsBoundary", () => {
  it("renders the UI with no params while the query string is unknown", async () => {
    const { container } = await mount(
      <SearchParamsBoundary
        render={(params) => <p>{params ? params.get("lang") : "no params"}</p>}
      />,
    );

    expect(container.textContent).toBe("no params");
  });

  it("hands the real params to the same UI once they are known", async () => {
    query = new URLSearchParams("lang=tamil");
    const { container } = await mount(
      <SearchParamsBoundary
        render={(params) => <p>{params ? params.get("lang") : "no params"}</p>}
      />,
    );

    expect(container.textContent).toBe("tamil");
  });
});

describe("KeyedByParams", () => {
  let mounts = 0;
  function Probe() {
    useEffect(() => {
      mounts++;
    }, []);
    return <p>content</p>;
  }

  it("shows the fallback until the query string is known", async () => {
    const { container } = await mount(
      <KeyedByParams params={["lang"]} fallback={<p>skeleton</p>}>
        <Probe />
      </KeyedByParams>,
    );

    expect(container.textContent).toBe("skeleton");
  });

  it("starts over under a fresh boundary when a keyed param changes, not for other params", async () => {
    mounts = 0;
    query = new URLSearchParams("lang=hindi");
    const ui = () => (
      <KeyedByParams params={["lang"]} fallback={<p>skeleton</p>}>
        <Probe />
      </KeyedByParams>
    );
    const { container, root } = await mount(ui());
    expect(container.textContent).toBe("content");
    expect(mounts).toBe(1);

    query = new URLSearchParams("lang=hindi&utm=x");
    await act(async () => root.render(ui()));
    expect(mounts).toBe(1);

    query = new URLSearchParams("lang=tamil");
    await act(async () => root.render(ui()));
    expect(mounts).toBe(2);
  });
});

describe("LanguageBar", () => {
  const selected = (container: HTMLElement) =>
    [...container.querySelectorAll("a[aria-current=page]")].map(
      (a) => a.textContent,
    );

  it("renders every chip, with none selected, before the query string is known", async () => {
    const { container } = await mount(<LanguageBar />);

    expect(container.querySelectorAll("a").length).toBeGreaterThan(10);
    expect(selected(container)).toEqual(["All"]);
  });

  it("selects the chip for ?lang= once it is known", async () => {
    query = new URLSearchParams("lang=tamil");
    const { container } = await mount(<LanguageBar />);

    expect(selected(container)).toEqual(["Tamil"]);
  });

  it("ignores a language it does not offer", async () => {
    query = new URLSearchParams("lang=klingon");
    const { container } = await mount(<LanguageBar />);

    expect(selected(container)).toEqual(["All"]);
  });
});

describe("a clicked language chip", () => {
  const selected = (container: HTMLElement) =>
    [...container.querySelectorAll("a[aria-current=page]")].map(
      (a) => a.textContent,
    );
  const chip = (container: HTMLElement, title: string) =>
    container.querySelector<HTMLElement>(`a[title="${title}"]`);

  it("is selected and swaps the list for its skeleton before the URL follows", async () => {
    query = new URLSearchParams("lang=hindi");
    const { container } = await mount(
      <>
        <LanguageBar />
        <KeyedByParams params={["lang"]} fallback={<p>skeleton</p>}>
          <p>list</p>
        </KeyedByParams>
      </>,
    );
    expect(selected(container)).toEqual(["Hindi"]);
    expect(container.textContent).toContain("list");

    // Click without letting the router commit (a plain click on the Link is
    // not followed in happy-dom): the URL still says hindi.
    await act(async () => chip(container, "Tamil")?.click());

    expect(selected(container)).toEqual(["Tamil"]);
    expect(container.textContent).toContain("skeleton");
    expect(container.textContent).not.toContain("list");
  });

  it("hands over to the real list once the URL matches", async () => {
    query = new URLSearchParams("lang=hindi");
    const ui = () => (
      <>
        <LanguageBar />
        <KeyedByParams params={["lang"]} fallback={<p>skeleton</p>}>
          <p>list</p>
        </KeyedByParams>
      </>
    );
    const { container, root } = await mount(ui());
    await act(async () => chip(container, "Tamil")?.click());

    query = new URLSearchParams("lang=tamil");
    await act(async () => root.render(ui()));

    expect(selected(container)).toEqual(["Tamil"]);
    expect(container.textContent).toContain("list");
    expect(container.textContent).not.toContain("skeleton");
  });

  it("ignores modified and non-primary clicks, which do not navigate", async () => {
    query = new URLSearchParams("lang=hindi");
    const { container } = await mount(<LanguageBar />);
    const tamil = chip(container, "Tamil");

    for (const init of [
      { ctrlKey: true },
      { metaKey: true },
      { shiftKey: true },
      { altKey: true },
      { button: 1 },
    ]) {
      await act(async () =>
        tamil?.dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true, ...init }),
        ),
      );
    }

    expect(selected(container)).toEqual(["Hindi"]);
  });

  it("drops a pending chip when the page is left", async () => {
    query = new URLSearchParams("lang=hindi");
    const ui = (
      <>
        <LanguageBar />
        <KeyedByParams params={["lang"]} fallback={<p>skeleton</p>}>
          <p>list</p>
        </KeyedByParams>
      </>
    );
    const first = await mount(ui);
    await act(async () => chip(first.container, "Tamil")?.click());
    await act(async () => first.root.unmount());

    const second = await mount(ui);
    expect(selected(second.container)).toEqual(["Hindi"]);
    expect(second.container.textContent).toContain("list");
  });
});
