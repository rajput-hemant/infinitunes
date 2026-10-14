import { afterEach, describe, expect, it } from "bun:test";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { ToolbarNavigation } from "../../components/site-header/toolbar-navigation";
import { siteConfig } from "../../config/site";

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
});

describe("phone toolbar brand", () => {
  it("shows the logo tile beside the wordmark", async () => {
    const container = await mount();

    const brand = container.querySelector<HTMLAnchorElement>('a[href="/"]');
    expect(brand?.textContent).toBe(siteConfig.name);
    expect(brand?.querySelector("span.bg-primary svg")).not.toBeNull();
  });

  it("has no history buttons", async () => {
    const container = await mount();

    expect(container.querySelector('[aria-label="Go back"]')).toBeNull();
    expect(container.querySelector('[aria-label="Go forward"]')).toBeNull();
  });
});
