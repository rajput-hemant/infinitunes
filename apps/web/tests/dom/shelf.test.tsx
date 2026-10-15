import { afterEach, expect, it } from "bun:test";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { Shelf } from "../../components/slider/shelf";

let root: Root | undefined;

afterEach(async () => {
  const current = root;
  if (current) await act(async () => current.unmount());
  root = undefined;
  document.body.replaceChildren();
});

const frame = () =>
  act(
    async () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
  );

it("reads layout once per frame and only re-renders when an edge flips", async () => {
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  const current = root;
  await act(async () => current.render(<Shelf>{[<li key="a">a</li>]}</Shelf>));

  const list = container.querySelector("ol");
  if (!list) throw new Error("shelf list not rendered");
  let scrollLeft = 0;
  let reads = 0;
  Object.defineProperty(list, "scrollLeft", {
    get: () => {
      reads += 1;
      return scrollLeft;
    },
  });
  Object.defineProperty(list, "clientWidth", { value: 100 });
  Object.defineProperty(list, "scrollWidth", { value: 1000 });
  const arrows = () =>
    [...container.querySelectorAll("button")].map((b) => b.disabled);

  const fire = () => list.dispatchEvent(new Event("scroll"));
  scrollLeft = 10;
  await act(async () => {
    for (let i = 0; i < 20; i++) fire();
  });
  await frame();
  // One apply per frame (two scrollLeft reads), not one per event.
  expect(reads).toBeLessThanOrEqual(2);
  expect(arrows()).toEqual([false, false]);

  scrollLeft = 900;
  await act(async () => fire());
  await frame();
  expect(arrows()).toEqual([false, true]);

  scrollLeft = 0;
  await act(async () => fire());
  await frame();
  expect(arrows()).toEqual([true, false]);
});
