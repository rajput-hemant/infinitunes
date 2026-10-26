import { describe, expect, test } from "bun:test";

import { siteConfig } from "~/config/site";
import { noindexMetadata, pageMetadata } from "~/lib/metadata";
import { ogImageUrl } from "~/lib/utils";

function ogImage(meta: ReturnType<typeof pageMetadata>) {
  return meta.openGraph!.images as { url: string; alt: string };
}

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
      title: "Tom & Jerry",
      description: "Soundtrack",
      alternates: {
        canonical: `${new URL(siteConfig.url).origin}/album/tom/abc`,
      },
      openGraph: {
        title: "Tom & Jerry",
        description: "Soundtrack",
        url: `${new URL(siteConfig.url).origin}/album/tom/abc`,
        images: {
          url: ogImageUrl({
            title: "Tom &amp; Jerry",
            description: "Soundtrack",
            image,
            square: true,
          }),
          alt: "Tom & Jerry",
        },
      },
    });
  });

  test("sets an absolute canonical that matches og:url", () => {
    const meta = pageMetadata({
      title: "Song",
      description: "d",
      url: "/song/a/b",
    });
    const canonical = meta.alternates?.canonical;

    expect(canonical).toBe(`${new URL(siteConfig.url).origin}/song/a/b`);
    expect<unknown>(meta.openGraph?.url).toBe(canonical);
  });

  test("percent-encodes ampersands so the image param is not truncated", () => {
    const url = new URL(
      ogImage(
        pageMetadata({
          title: "Download & Play",
          description: "a & b",
          url: "/",
          image: "https://x/y.png",
        }),
      ).url,
      "https://example.com",
    );

    expect(url.searchParams.get("title")).toBe("Download & Play");
    expect(url.searchParams.get("image")).toBe("https://x/y.png");
  });

  test("uses a custom alt when given", () => {
    const meta = pageMetadata({
      title: "t",
      description: "d",
      url: "/",
      image: "i",
      alt: "Homepage",
    });
    expect(ogImage(meta).alt).toBe("Homepage");
  });
});

describe("noindexMetadata", () => {
  test("asks crawlers not to index the page", () => {
    expect(noindexMetadata.robots).toEqual({ index: false });
  });
});
