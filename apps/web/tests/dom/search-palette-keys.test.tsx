import { describe, expect, it } from "bun:test";

import { act, useState } from "react";
import { createRoot } from "react-dom/client";

import { useSearchPaletteKeys } from "../../components/search/use-search-palette-keys";

function Harness() {
  const [rows, setRows] = useState<string[]>([]);
  const { activeOptionId } = useSearchPaletteKeys({
    enabled: true,
    listboxId: "lb",
    resetKey: "",
  });
  return (
    <div>
      <input aria-controls="lb" data-active={activeOptionId ?? ""} />
      <button type="button" onClick={() => setRows(["a", "b"])}>
        fill
      </button>
      <div id="lb">
        {rows.map((row) => (
          <div key={row} data-search-option>
            {row}
          </div>
        ))}
      </div>
    </div>
  );
}

describe("search palette keyboard selection", () => {
  it("has no active descendant until there are rows to point at", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(<Harness />);
    });

    const input = container.querySelector("input");
    expect(input?.dataset.active).toBe("");

    await act(async () => container.querySelector("button")?.click());
    await act(async () => new Promise((r) => setTimeout(r, 0)));
    expect(input?.dataset.active).toBe("lb-option-0");
    expect(document.getElementById("lb-option-0")?.textContent).toBe("a");

    await act(async () => root.unmount());
    container.remove();
  });
});
