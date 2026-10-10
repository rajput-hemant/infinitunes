import { afterEach, describe, expect, it, mock } from "bun:test";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { siteConfig } from "../../config/site";

let pathname = "/";

mock.module("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ back: () => {}, forward: () => {} }),
}));

const { ToolbarNavigation } =
  await import("../../components/site-header/toolbar-navigation");

const roots: Root[] = [];

async function mount() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => root.render(<ToolbarNavigation />));
  return container;
}

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
  document.body.innerHTML = "";
  pathname = "/";
});

describe("phone toolbar brand", () => {
  it("shows the red tile logo beside the wordmark on home", async () => {
    const container = await mount();

    const brand = container.querySelector<HTMLAnchorElement>('a[href="/"]');
    expect(brand?.textContent).toBe(siteConfig.name);
    expect(brand?.querySelector("svg")).not.toBeNull();
    expect(brand?.querySelector("span.bg-primary svg")).not.toBeNull();
  });

  it("swaps the brand for history controls on other routes", async () => {
    pathname = "/album";
    const container = await mount();

    expect(container.querySelector('a[href="/"]')).toBeNull();
    expect(container.querySelector('[aria-label="Go back"]')).not.toBeNull();
  });
});
