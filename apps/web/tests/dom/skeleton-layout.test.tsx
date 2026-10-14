import { describe, expect, it } from "bun:test";

import { renderToStaticMarkup } from "react-dom/server";

import { CatalogGrid } from "../../app/(root)/browse/_components/catalog-grid";
import {
  CatalogGridSkeleton,
  CatalogHeaderSkeleton,
} from "../../app/(root)/browse/_components/catalog-skeleton";
import { detailBandClassName } from "../../components/details-header/details-header-band";
import { DetailsHeaderSkeleton } from "../../components/details-header/details-header-skeleton";
import {
  shelfItemClassName,
  shelfListClassName,
} from "../../components/slider/shelf-layout";
import { ShelfSkeleton } from "../../components/slider/shelf-skeleton";
import { SongListSkeleton } from "../../components/song-list/song-list-skeleton";

function classOf(html: string, tag: string): string {
  const match = new RegExp(`<${tag} [^>]*class="([^"]*)"`).exec(html);
  return match?.[1] ?? "";
}

describe("loading skeletons share the real layout", () => {
  it("lays a shelf skeleton out on the real shelf list and item classes", () => {
    const html = renderToStaticMarkup(<ShelfSkeleton rows={2} count={3} />);

    const skeletonList = classOf(html, "ol")
      .replaceAll("&amp;", "&")
      .split(" ");

    // Everything the real list does to place cards, minus its scrolling.
    for (const token of shelfListClassName(2).split(" ")) {
      if (token !== "overflow-x-auto") expect(skeletonList).toContain(token);
    }
    expect(html.split(`<li class="${shelfItemClassName}"`)).toHaveLength(7);
  });

  it("puts catalog skeleton cards in the catalog grid", () => {
    const grid = renderToStaticMarkup(<CatalogGrid>{null}</CatalogGrid>);
    const skeleton = renderToStaticMarkup(<CatalogGridSkeleton count={4} />);

    expect(classOf(skeleton, "div")).toBe(classOf(grid, "div"));
  });

  it("keeps the catalog header's spacing, with or without a subtitle", () => {
    const withSubtitle = renderToStaticMarkup(<CatalogHeaderSkeleton />);
    const bare = renderToStaticMarkup(
      <CatalogHeaderSkeleton subtitle={false} />,
    );

    expect(classOf(withSubtitle, "header")).toBe("space-y-1 pt-2 pb-6");
    expect(classOf(bare, "header")).toBe("space-y-1 pt-2 pb-6");
    expect(withSubtitle.length).toBeGreaterThan(bare.length);
  });

  it("draws the details header in the artwork band and rounds artists", () => {
    const album = renderToStaticMarkup(<DetailsHeaderSkeleton type="album" />);
    const artist = renderToStaticMarkup(
      <DetailsHeaderSkeleton type="artist" />,
    );

    expect(album).toContain(detailBandClassName.split(" ")[0]);
    expect(album).not.toContain("rounded-full");
    expect(artist).toContain("rounded-full");
  });

  it("renders the requested number of song rows", () => {
    const html = renderToStaticMarkup(<SongListSkeleton length={7} />);

    expect(html.match(/h-row/g)).toHaveLength(7);
  });
});
