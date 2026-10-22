import { afterEach, describe, expect, it, mock } from "bun:test";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

const toastError = mock((_message: string) => {});
mock.module("next/navigation", () => ({ usePathname: () => "/song/x/abc" }));
mock.module("sonner", () => ({
  toast: Object.assign(() => {}, { success() {}, error: toastError }),
}));

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

describe("ShareOptions path", () => {
  it("shares the page URL by default", async () => {
    const c = await mount(<ShareOptions title="Tum Hi Ho" />);
    expect(hrefOf(c, "Facebook")).toContain(encodeURIComponent("/song/x/abc"));
  });

  it("shares the given item path instead of the page it sits on", async () => {
    const c = await mount(
      <ShareOptions title="Tum Hi Ho" path="/song/tum-hi-ho/xyz" />,
    );
    const href = hrefOf(c, "Facebook") ?? "";
    expect(href).toContain(encodeURIComponent("/song/tum-hi-ho/xyz"));
    expect(href).not.toContain(encodeURIComponent("/song/x/abc"));
  });

  it("falls back to the page when the item has no link", async () => {
    const c = await mount(<ShareOptions path="#" />);
    expect(hrefOf(c, "Facebook")).toContain(encodeURIComponent("/song/x/abc"));
  });
});

describe("ShareOptions copy", () => {
  it("names the Copy Link button after its current state only", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.resolve() },
      configurable: true,
    });
    const c = await mount(<ShareOptions />);
    const button = c.querySelector("button") as HTMLButtonElement;
    expect(button.textContent).toBe("Copy Link");

    await act(async () => button.click());
    expect(button.textContent).toBe("Link Copied");
  });

  it("resets the Link Copied label after a moment", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.resolve() },
      configurable: true,
    });
    const c = await mount(<ShareOptions />);
    const button = c.querySelector("button") as HTMLButtonElement;
    await act(async () => button.click());
    expect(button.textContent).toBe("Link Copied");

    await act(async () => new Promise((r) => setTimeout(r, 2100)));
    expect(button.textContent).toBe("Copy Link");
  });

  it("reports a rejected clipboard write instead of claiming success", async () => {
    toastError.mockClear();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("denied")) },
      configurable: true,
    });
    const c = await mount(<ShareOptions />);
    const button = c.querySelector("button") as HTMLButtonElement;
    await act(async () => button.click());

    expect(button.textContent).toBe("Copy Link");
    expect(toastError).toHaveBeenCalledWith("Couldn't copy the link");
  });

  it("reports a missing clipboard API", async () => {
    toastError.mockClear();
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    });
    const c = await mount(<ShareOptions />);
    const button = c.querySelector("button") as HTMLButtonElement;
    await act(async () => button.click());

    expect(button.textContent).toBe("Copy Link");
    expect(toastError).toHaveBeenCalledWith("Couldn't copy the link");
  });
});

describe("ShareOptions in a dropdown", () => {
  it("renders each option as one menu item, with no control nested inside", async () => {
    const { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } =
      await import("@infinitunes/ui/components/dropdown-menu");
    await mount(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Share</DropdownMenuTrigger>
        <DropdownMenuContent>
          <ShareOptions isDropDownItem title="Tum Hi Ho" />
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    const items = [...document.querySelectorAll('[role="menuitem"]')];
    expect(items.map((i) => i.textContent)).toEqual([
      "Copy Link",
      "WhatsApp",
      "Telegram",
      "Twitter",
      "Facebook",
      "Email",
    ]);
    for (const item of items) {
      expect(item.querySelector("a, button")).toBeNull();
    }
    const twitter = items.find((i) => i.textContent === "Twitter");
    expect(twitter?.tagName).toBe("A");
    expect(twitter?.getAttribute("href")).toContain("text=Tum%20Hi%20Ho");
  });
});
