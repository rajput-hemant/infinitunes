import { afterEach, describe, expect, it, mock } from "bun:test";

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";

mock.module("next/navigation", () => ({
  usePathname: () => "/song/tum-hi-ho/abc",
  useRouter: () => ({ push() {} }),
}));
mock.module("sonner", () => ({ toast: { success() {}, error() {} } }));

const { ShareButton } =
  await import("../../components/details-header/share-button");

const roots: Root[] = [];

async function mount(title: string) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(<ShareButton title={title} />);
  });
  return container;
}

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
  document.body.innerHTML = "";
});

describe("details header ShareButton", () => {
  it("renders an icon button named Share that opens a menu", async () => {
    const container = await mount("Tum Hi Ho");

    const button = container.querySelector("button");
    expect(button?.getAttribute("aria-label")).toBe("Share");
    expect(button?.getAttribute("aria-haspopup")).toBe("menu");
  });

  it("offers the same share destinations as the shared share options", async () => {
    const container = await mount("Tum Hi Ho");
    const button = container.querySelector("button");

    await act(async () => {
      button?.click();
    });

    const menuText = document.body.textContent ?? "";
    expect(menuText).toContain("Copy Link");
    expect(menuText).toContain("WhatsApp");
    expect(menuText).toContain("Email");
  });
});
