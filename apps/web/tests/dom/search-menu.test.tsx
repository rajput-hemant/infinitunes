import { afterEach, expect, it, jest, mock } from "bun:test";

import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { setInputValue } from "./set-input-value";
import { waitFor } from "./wait-for";

const searchInputs: { q: string }[] = [];
mock.module("../../lib/trpc/vanilla", () => ({
  trpc: {
    search: {
      all: {
        query: (input: { q: string }) => {
          searchInputs.push(input);
          return new Promise(() => {});
        },
      },
    },
  },
}));
mock.module("../../components/search/search-all", () => ({
  SearchAll: () => null,
}));

const { SearchMenu } = await import("../../components/search/search-menu");
const roots: Root[] = [];

/** The palette is its own chunk: the click starts the import and opens it on arrival. */
async function openSearch(container: HTMLElement) {
  await act(async () => container.querySelector("button")?.click());
  await waitFor(() => document.querySelector("[data-search-palette]") !== null);
}
const GO_TO_HREFS = ["/chart", "/me", "/settings#appearance"];

const optionsIn = () => [
  ...document.querySelectorAll<HTMLElement>("[data-search-option]"),
];

// happy-dom does not bubble element events up to window, where the hook listens.
function pressKey(input: HTMLElement | null, key: string) {
  return act(async () => {
    const event = new KeyboardEvent("keydown", { key });
    Object.defineProperty(event, "target", { value: input });
    window.dispatchEvent(event);
  });
}

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
  await waitFor(() => document.querySelector("[data-search-palette]") !== null);
  expect(trigger()?.getAttribute("aria-expanded")).toBe("true");
  const input = document.querySelector<HTMLInputElement>(
    'input[aria-label="Search"]',
  );
  if (!input) throw new Error("search input not rendered");
  await act(async () => setInputValue(input, "old query"));
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

  await openSearch(container);
  const input = document.querySelector<HTMLInputElement>('[role="combobox"]');
  const options = optionsIn;
  const selectedStates = () =>
    options().map((o) => o.getAttribute("aria-selected"));
  const press = (key: string) => pressKey(input, key);

  expect(input?.getAttribute("aria-controls")).toBe(
    document.querySelector('[role="listbox"]')?.id ?? "",
  );
  // The two test options, then the three Go to pages.
  expect(selectedStates()).toEqual([
    "true",
    "false",
    "false",
    "false",
    "false",
  ]);
  expect(input?.getAttribute("aria-activedescendant")).toBe(options()[0]?.id);

  await press("ArrowDown");
  expect(selectedStates()).toEqual([
    "false",
    "true",
    "false",
    "false",
    "false",
  ]);
  expect(input?.getAttribute("aria-activedescendant")).toBe(options()[1]?.id);

  await press("Enter");
  expect(clicked).toEqual(["two"]);

  await press("ArrowDown");
  expect(selectedStates()[2]).toBe("true");
});

it("lists the Go to pages as options, outside the tab order", async () => {
  const { container } = await renderMenu(<p>Top searches</p>);
  await openSearch(container);

  const goTo = document.getElementById(`search-palette-listbox-go-to`);
  expect(goTo?.textContent).toBe("Go to");
  const hrefs = optionsIn().map((o) => o.getAttribute("href"));
  expect(hrefs).toEqual(GO_TO_HREFS);
  expect(optionsIn().map((o) => o.tabIndex)).toEqual([-1, -1, -1]);
});

it("moves the active option through Go to with arrows, wrapping at both ends", async () => {
  const { container } = await renderMenu(<p>Top searches</p>);
  await openSearch(container);
  const input = document.querySelector<HTMLInputElement>('[role="combobox"]');
  const activeHref = () => {
    const id = input?.getAttribute("aria-activedescendant");
    return optionsIn()
      .find((o) => o.id === id)
      ?.getAttribute("href");
  };

  expect(activeHref()).toBe("/chart");
  await pressKey(input, "ArrowUp");
  expect(activeHref()).toBe("/settings#appearance");
  await pressKey(input, "ArrowDown");
  expect(activeHref()).toBe("/chart");
  await pressKey(input, "ArrowDown");
  await pressKey(input, "ArrowDown");
  expect(activeHref()).toBe("/settings#appearance");
});

it("renders the phone palette as the glass palette role with its key hints", async () => {
  const { container } = await renderMenu(<p>Top searches</p>);
  await openSearch(container);

  const palette = document.querySelector<HTMLElement>("[data-search-palette]");
  expect(palette?.dataset.glassRole).toBe("palette");
  const hints = palette?.querySelectorAll("kbd") ?? [];
  expect([...hints].map((kbd) => kbd.textContent)).toEqual([
    "↑",
    "↓",
    "↵",
    "esc",
  ]);
});

it("sends one search for a typed word, after the typing pause", async () => {
  jest.useFakeTimers();
  try {
    const { container } = await renderMenu(<p>Top searches</p>);
    await openSearch(container);
    const input = document.querySelector<HTMLInputElement>(
      'input[aria-label="Search"]',
    );
    if (!input) throw new Error("search input not rendered");
    searchInputs.length = 0;

    for (const typed of ["a", "ar", "ari", "arij"]) {
      await act(async () => setInputValue(input, typed));
      await act(async () => {
        jest.advanceTimersByTime(80);
      });
    }
    // The field itself is never held back.
    expect(input.value).toBe("arij");
    // Nothing is asked while the word is still being typed.
    expect(searchInputs).toEqual([]);

    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(searchInputs.map((i) => i.q)).toEqual(["arij"]);
  } finally {
    jest.useRealTimers();
  }
});
