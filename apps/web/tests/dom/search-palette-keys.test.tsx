import { afterEach, expect, it } from "bun:test";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

const { useSearchPaletteKeys } = await import(
  "../../components/search/use-search-palette-keys"
);

function PaletteHarness(props: { enabled: boolean }) {
  useSearchPaletteKeys(props.enabled, "test-listbox");

  return (
    <div id="test-listbox">
      <button type="button" data-search-palette-row>
        One
      </button>
      <button type="button" data-search-palette-row>
        Two
      </button>
    </div>
  );
}

const roots: Root[] = [];

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
});

it("marks the second row selected after ArrowDown from the start", async () => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);

  await act(async () => {
    root.render(<PaletteHarness enabled />);
  });

  const rows = () =>
    [...document.querySelectorAll<HTMLElement>("[data-search-palette-row]")];

  expect(rows()[0]?.getAttribute("aria-selected")).toBe("false");

  await act(async () => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
    );
  });

  expect(rows()[0]?.getAttribute("aria-selected")).toBe("true");
});
