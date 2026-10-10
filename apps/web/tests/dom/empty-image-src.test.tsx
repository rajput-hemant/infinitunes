import { afterEach, describe, expect, it } from "bun:test";

import { act } from "react";
import { createRoot } from "react-dom/client";

import { ImageWithFallback } from "../../components/image-with-fallback";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("ImageWithFallback empty src guard (UI-61)", () => {
  it("renders without throwing when src is empty string", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    // Should not throw - the fix uses fallback immediately for empty src
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

    expect(container).toBeDefined();
    await act(async () => root.unmount());
  });

  it("renders without throwing when src is undefined", async () => {
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

    expect(container).toBeDefined();
    await act(async () => root.unmount());
  });

  it("renders without throwing when src is valid", async () => {
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

    expect(container).toBeDefined();
    await act(async () => root.unmount());
  });
});
