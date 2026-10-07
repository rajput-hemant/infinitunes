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

it("stays closed when returning to the path where search was opened", async () => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  const navigate = async (pathname: string) => {
    await act(async () => {
      root.render(
        <PathnameContext.Provider value={pathname}>
          <SearchMenu topSearch={<p>Top searches</p>} />
        </PathnameContext.Provider>,
      );
    });
  };
  const trigger = () => container.querySelector("button");

  await navigate("/a");
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
