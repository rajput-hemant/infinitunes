import { afterEach, describe, expect, it } from "bun:test";

import { act } from "react";
import { createRoot } from "react-dom/client";

import { KeyboardShortcutsDialog } from "../../components/site-header/keyboard-shortcuts-dialog";

const realUserAgent = navigator.userAgent;

function setUserAgent(value: string) {
  Object.defineProperty(navigator, "userAgent", {
    value,
    configurable: true,
  });
}

async function searchCaps() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<KeyboardShortcutsDialog open onOpenChange={() => {}} />);
  });
  const row = [...document.querySelectorAll("dd")].find(
    (dd) => dd.textContent === "Search",
  );
  const caps = [
    ...(row?.previousElementSibling?.querySelectorAll("kbd") ?? []),
  ].map((kbd) => kbd.textContent);
  await act(async () => root.unmount());
  container.remove();
  return caps;
}

afterEach(() => setUserAgent(realUserAgent));

describe("keyboard shortcuts dialog", () => {
  it("shows Ctrl on other platforms", async () => {
    setUserAgent("Mozilla/5.0 (X11; Linux x86_64)");
    expect(await searchCaps()).toEqual(["Ctrl", "K"]);
  });

  it("shows the Cmd key on macOS", async () => {
    setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)");
    expect(await searchCaps()).toEqual(["⌘", "K"]);
  });
});
