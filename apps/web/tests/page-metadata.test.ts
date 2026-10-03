import { describe, expect, test } from "bun:test";

import { pageMetadata } from "~/lib/metadata";
import { ogImageUrl } from "~/lib/utils";

describe("pageMetadata", () => {
  test("mirrors title and description into openGraph and builds the OG image", () => {
    const image = "https://c.saavncdn.com/a-500x500.jpg";

    expect(
      pageMetadata({
        title: "Tom &amp; Jerry",
        description: "Soundtrack",
        url: "/album/tom/abc",
        image,
        square: true,
      }),
    ).toEqual({
      title: "Tom &amp; Jerry",
      description: "Soundtrack",
      openGraph: {
        title: "Tom &amp; Jerry",
        description: "Soundtrack",
        url: "/album/tom/abc",
        images: {
          url: ogImageUrl({
            title: "Tom &amp; Jerry",
            description: "Soundtrack",
            image,
            square: true,
          }),
          alt: "Tom &amp; Jerry",
        },
      },
    });
  });

  test("percent-encodes ampersands so the image param is not truncated", () => {
    const { openGraph } = pageMetadata({
      title: "Download & Play",
      description: "a & b",
      url: "/",
      image: "https://x/y.png",
    });
    const url = new URL(
      (openGraph?.images as { url: string }).url,
      "https://example.com",
    );

    expect(url.searchParams.get("title")).toBe("Download & Play");
    expect(url.searchParams.get("image")).toBe("https://x/y.png");
  });

  test("uses a custom alt when given", () => {
    const { openGraph } = pageMetadata({
      title: "t",
      description: "d",
      url: "/",
      image: "i",
      alt: "Homepage",
    });
    expect((openGraph?.images as { alt: string }).alt).toBe("Homepage");
  });
});
