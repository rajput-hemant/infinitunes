import { afterEach, describe, expect, it } from "bun:test";

import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";

import { MainNav } from "../../components/site-header/main-nav";

const roots: Root[] = [];

async function mount() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(<MainNav megaMenu={{ mega_menu: {} } as never} />);
  });
  return container;
}

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
});

describe("MainNav", () => {
  it("renders the mega menu trigger as a button, not inside a link", async () => {
    const container = await mount();
    const trigger = [...container.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("Music"),
    );

    expect(trigger).toBeDefined();
    expect(trigger?.closest("a")).toBeNull();
  });

  it("opens to a View all Music link", async () => {
    const container = await mount();
    const trigger = container.querySelector("button") as HTMLButtonElement;

    await act(async () => trigger.click());

    const link = [...document.querySelectorAll("a")].find((a) =>
      a.textContent?.includes("View all Music"),
    );
    expect(link?.getAttribute("href")).toBe("/");
  });
});
