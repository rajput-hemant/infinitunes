import { afterEach, describe, expect, it, spyOn } from "bun:test";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import RootError from "../../app/(root)/error";
import LibraryError from "../../app/(root)/me/(layout-a)/error";
import AppError from "../../app/error";

const roots: Root[] = [];

async function render(
  Boundary: typeof AppError,
  error: Error,
  retry: () => void,
) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => {
    root.render(<Boundary error={error} retry={retry} />);
  });
  return container;
}

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
});

const boundaries = [
  ["app/error.tsx", AppError, /something went wrong/i],
  ["(root)/error.tsx", RootError, /something went wrong/i],
  [
    "(root)/me/(layout-a)/error.tsx",
    LibraryError,
    /couldn.t load this section/i,
  ],
] as const;

describe.each(boundaries)("%s", (_name, Boundary, heading) => {
  it("renders a recoverable outage message and retries on click", async () => {
    const logged = spyOn(console, "error").mockImplementation(() => {});
    const error = Object.assign(new Error("Upstream network failure"), {
      digest: "1652480273",
    });
    let retries = 0;

    const container = await render(Boundary, error, () => void retries++);

    expect(container.textContent).toMatch(heading);
    expect(container.textContent).not.toContain("Upstream network failure");
    const button = container.querySelector("button");
    expect(button?.textContent).toMatch(/try again/i);

    await act(async () => button?.click());

    expect(retries).toBe(1);
    expect(logged).toHaveBeenCalledWith(error);
    logged.mockRestore();
  });
});
