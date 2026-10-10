import { afterEach, describe, expect, it } from "bun:test";

import { act } from "react";
import { createRoot } from "react-dom/client";

import { ImageWithFallback } from "~/components/image-with-fallback";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("ImageWithFallback empty src guard", () => {
  it("uses fallback when src is empty string", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <ImageWithFallback
          src=""
          alt="test"
          fallback="/images/placeholder/song.jpg"
          fill
          sizes="100px"
        />,
      );
    });

    const img = container.querySelector("img");
    const src = decodeURIComponent(img?.getAttribute("src") ?? "");
    expect(src).toContain("/images/placeholder/song.jpg");
    await act(async () => root.unmount());
  });

  it("uses fallback when src is undefined", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <ImageWithFallback
          src={undefined as unknown as string}
          alt="test"
          fallback="/images/placeholder/song.jpg"
          fill
          sizes="100px"
        />,
      );
    });

    const img = container.querySelector("img");
    const src = decodeURIComponent(img?.getAttribute("src") ?? "");
    expect(src).toContain("/images/placeholder/song.jpg");
    await act(async () => root.unmount());
  });

  it("renders valid src without using fallback", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <ImageWithFallback
          src="https://example.com/image.jpg"
          alt="test"
          fallback="/images/placeholder/song.jpg"
          fill
          sizes="100px"
        />,
      );
    });

    const img = container.querySelector("img");
    const src = decodeURIComponent(img?.getAttribute("src") ?? "");
    expect(src).toContain("example.com/image.jpg");
    expect(src).not.toContain("placeholder");
    await act(async () => root.unmount());
  });
});
