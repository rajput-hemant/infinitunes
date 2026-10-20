import { afterEach, beforeEach, describe, expect, it, jest } from "bun:test";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { useDebouncedValue } from "../../src/react/use-debounced-value";

let root: Root | undefined;
const seen: string[] = [];

function Probe({ value }: { value: string }) {
  seen.push(useDebouncedValue(value, 200, { immediate: "" }));
  return null;
}

const latest = () => seen[seen.length - 1];

async function render(value: string) {
  if (!root) {
    const container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  }
  const current = root;
  await act(async () => current.render(<Probe value={value} />));
}

const advance = (ms: number) =>
  act(async () => {
    jest.advanceTimersByTime(ms);
  });

beforeEach(() => {
  jest.useFakeTimers();
  seen.length = 0;
});

afterEach(async () => {
  jest.useRealTimers();
  const current = root;
  if (current) await act(async () => current.unmount());
  root = undefined;
  document.body.replaceChildren();
});

describe("useDebouncedValue", () => {
  it("starts with the first value", async () => {
    await render("a");
    expect(latest()).toBe("a");
  });

  it("settles on the last value only after a quiet period", async () => {
    await render("");
    await render("ar");
    await advance(150);
    await render("ari");
    await advance(150);
    expect(latest()).toBe("");
    await advance(60);
    expect(latest()).toBe("ari");
    expect(seen).not.toContain("ar");
  });

  it("returns the immediate value without waiting", async () => {
    await render("ari");
    await advance(200);
    expect(latest()).toBe("ari");
    await render("");
    expect(latest()).toBe("");
  });
});
