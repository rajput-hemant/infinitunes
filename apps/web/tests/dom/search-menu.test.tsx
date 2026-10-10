import { afterEach, expect, it, mock } from "bun:test";

import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { setInputValue } from "./set-input-value";

mock.module("../../lib/trpc/client", () => ({
  api: { search: { all: { useQuery: () => ({}) } } },
}));
mock.module("../../components/search/search-all", () => ({
  SearchAll: () => null,
}));

const { SearchMenu } = await import("../../components/search/search-menu");
const roots: Root[] = [];

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
});

async function renderMenu(topSearch: React.ReactNode, pathname = "/a") {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  const navigate = async (next: string) => {
    await act(async () => {
      root.render(
        <PathnameContext.Provider value={next}>
          <SearchMenu topSearch={topSearch} />
        </PathnameContext.Provider>,
      );
    });
  };
  await navigate(pathname);
  return { container, navigate };
}

it("stays closed when returning to the path where search was opened", async () => {
  const { container, navigate } = await renderMenu(<p>Top searches</p>);
  const trigger = () => container.querySelector("button");

  await act(async () => trigger()?.click());
  expect(trigger()?.getAttribute("aria-expanded")).toBe("true");
  const input = document.querySelector<HTMLInputElement>(
    'input[aria-label="Search"]',
  );
  expect(input).not.toBeNull();
  await act(async () => setInputValue(input!, "old query"));
  expect(input?.value).toBe("old query");

  await navigate("/b");
  expect(trigger()?.getAttribute("aria-expanded")).toBe("false");
  await navigate("/a");
  expect(trigger()?.getAttribute("aria-expanded")).toBe("false");
});

it("drives option selection from the combobox with arrows and Enter", async () => {
  const clicked: string[] = [];
  const option = (name: string) => (
    <a
      key={name}
      href={`#${name}`}
      data-search-option=""
      onClick={(e) => {
        e.preventDefault();
        clicked.push(name);
      }}
    >
      {name}
    </a>
  );
  const { container } = await renderMenu(
    <div>
      {option("one")}
      {option("two")}
    </div>,
  );

  await act(async () => container.querySelector("button")?.click());
  const input = document.querySelector<HTMLInputElement>('[role="combobox"]');
  const options = () => [
    ...document.querySelectorAll<HTMLElement>("[data-search-option]"),
  ];
  // happy-dom does not bubble element events up to window, where the hook listens.
  const press = (key: string) =>
    act(async () => {
      const event = new KeyboardEvent("keydown", { key });
      Object.defineProperty(event, "target", { value: input });
      window.dispatchEvent(event);
    });

  expect(input?.getAttribute("aria-controls")).toBe(
    document.querySelector('[role="listbox"]')?.id ?? "",
  );
  expect(options().map((o) => o.getAttribute("aria-selected"))).toEqual([
    "true",
    "false",
  ]);
  expect(input?.getAttribute("aria-activedescendant")).toBe(options()[0]?.id);

  await press("ArrowDown");
  expect(options().map((o) => o.getAttribute("aria-selected"))).toEqual([
    "false",
    "true",
  ]);
  expect(input?.getAttribute("aria-activedescendant")).toBe(options()[1]?.id);

  await press("Enter");
  expect(clicked).toEqual(["two"]);

  await press("ArrowDown");
  expect(options()[0]?.getAttribute("aria-selected")).toBe("true");
});
