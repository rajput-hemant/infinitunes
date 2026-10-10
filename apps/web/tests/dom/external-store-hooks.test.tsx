import { afterEach, describe, expect, it, mock } from "bun:test";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

void mock.module("next/navigation", () => ({
  useParams: () => ({}),
}));
void mock.module("next/image", () => ({
  default: ({ src, alt, onError }: Record<string, never>) => (
    <img src={src} alt={alt} onError={onError} />
  ),
}));

const { ImageWithFallback } =
  await import("../../components/image-with-fallback");
const { useHash } = await import("../../hooks/use-hash");

const roots: Root[] = [];

async function render(node: React.ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => root.render(node));
  return { container, root };
}

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((r) => r.unmount()));
  window.location.hash = "";
});

describe("ImageWithFallback", () => {
  it("swaps to the fallback on error and retries after src changes away and back", async () => {
    const view = (src: string) => (
      <ImageWithFallback src={src} fallback="/fb.png" alt="x" />
    );
    const { container, root } = await render(view("/a.png"));
    const img = () => container.querySelector("img") as HTMLImageElement;
    expect(img().getAttribute("src")).toBe("/a.png");

    await act(async () => {
      img().dispatchEvent(new window.Event("error"));
    });
    expect(img().getAttribute("src")).toBe("/fb.png");

    await act(async () => root.render(view("/b.png")));
    expect(img().getAttribute("src")).toBe("/b.png");

    await act(async () => root.render(view("/a.png")));
    expect(img().getAttribute("src")).toBe("/a.png");
  });
});

describe("useHash", () => {
  function Hash() {
    return <p>{String(useHash())}</p>;
  }

  it("reads the decoded hash and follows hashchange", async () => {
    window.location.hash = "#a%20b";
    const { container } = await render(<Hash />);
    expect(container.textContent).toBe("a b");

    await act(async () => {
      window.location.hash = "#next";
      window.dispatchEvent(new window.Event("hashchange"));
    });
    expect(container.textContent).toBe("next");
  });
});
