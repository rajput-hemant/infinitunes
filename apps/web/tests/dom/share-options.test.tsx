import { afterEach, describe, expect, it, mock } from "bun:test";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

mock.module("next/navigation", () => ({ usePathname: () => "/song/x/abc" }));

const { ShareOptions } = await import("../../components/share-options");

const roots: Root[] = [];

async function mount(ui: React.ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => root.render(ui));
  return container;
}

const hrefOf = (c: Element, label: string) =>
  [...c.querySelectorAll("a")]
    .find((a) => a.textContent?.includes(label))
    ?.getAttribute("href");

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
  document.body.replaceChildren();
});

describe("ShareOptions title", () => {
  it("puts the given item title in the share intents", async () => {
    const c = await mount(<ShareOptions title="Tum Hi Ho" />);
    expect(hrefOf(c, "Twitter")).toContain("text=Tum%20Hi%20Ho");
    expect(hrefOf(c, "Email")).toContain("subject=Tum%20Hi%20Ho");
  });

  it("falls back to the site name without a title", async () => {
    const c = await mount(<ShareOptions />);
    expect(hrefOf(c, "Twitter")).toContain("text=Infinitunes");
  });
});
