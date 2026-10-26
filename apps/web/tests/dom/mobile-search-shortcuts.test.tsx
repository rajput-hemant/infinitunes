import { afterEach, expect, it, mock } from "bun:test";

import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";

import { setInputValue } from "./set-input-value";
import { waitFor } from "./wait-for";

mock.module("next/navigation", () => ({ useRouter: () => ({ push() {} }) }));
mock.module("~/lib/trpc/vanilla", () => ({
  trpc: { search: { all: { query: async () => null } } },
}));
mock.module("../../components/search/search-all", () => ({
  SearchAll: () => null,
}));
const { MobileSearch } =
  await import("../../app/(root)/search/_components/mobile-search");
const { useIsTyping } = await import("../../hooks/use-store");
let root: Root;
afterEach(async () => {
  await act(async () => root?.unmount());
  document.body.replaceChildren();
});

it("leaves player shortcuts enabled after departing a nonempty search", async () => {
  let typing = false;
  function Probe() {
    const [isTyping] = useIsTyping();
    useEffect(() => {
      typing = isTyping;
    }, [isTyping]);
    return null;
  }
  const host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () =>
    root.render(
      <>
        <Probe />
        <MobileSearch topSearches={null} />
      </>,
    ),
  );
  const input = host.querySelector("input")!;
  await act(async () => setInputValue(input, "music"));
  await waitFor(() => host.textContent?.includes("No matches") === true);
  await act(async () => root.render(<Probe />));
  expect(typing).toBe(false);
});

it("names the recent searches clear button for screen readers", async () => {
  localStorage.setItem("recent_searches", JSON.stringify(["lofi"]));
  const host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<MobileSearch topSearches={null} />));
  const clear = [...host.querySelectorAll("button")].find(
    (button) => button.textContent === "Clear",
  );
  expect(clear?.getAttribute("aria-label")).toBe("Clear recent searches");
  localStorage.removeItem("recent_searches");
});
