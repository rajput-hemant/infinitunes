"use client";

import type { ResponsiveBones } from "boneyard-js";
import { Skeleton } from "boneyard-js/react";
import { Loader2 } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

import catalogCards from "~/bones/catalog-cards.bones.json";
import { SliderCard } from "~/components/slider/slider-card";

import { CatalogGrid } from "./catalog-grid";

/**
 * What `bun run skeletons:capture` snapshots (`window.__BONEYARD_BUILD`): one
 * full row of cards with no data behind them, so the bones never depend on
 * what upstream returned that day. The grid's column count is auto-fill, so
 * the row is sized from the rendered grid (no lone card on a second row).
 */
function FixtureRow() {
  const [columns, setColumns] = useState(2);
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const grid = ref.current?.firstElementChild;
    if (!grid) return;
    setColumns(getComputedStyle(grid).gridTemplateColumns.split(" ").length);
  }, []);

  return (
    <div ref={ref}>
      <CatalogGrid>
        {Array.from({ length: columns }, (_, index) => (
          <SliderCard
            key={index}
            name="Loading"
            subtitle="Loading"
            type="playlist"
            url={`https://www.jiosaavn.com/featured/loading/${index}`}
            image=""
            hidePlayButton
          />
        ))}
      </CatalogGrid>
    </div>
  );
}

/**
 * Bones measured from real cards at 360, 768 and 1280px. Regenerate after a
 * card or grid change: `next start` on :3000 (production build), then
 * `bun run skeletons:capture` (first run: `bunx playwright install chromium`).
 */
const bones = catalogCards as ResponsiveBones;

/**
 * The next page of a catalog grid while it loads. Bones need the measured
 * width, so the spinner stands in until mount. Pulse animates colour only,
 * so reduced motion keeps it.
 */
export function NextPageSkeleton({ loading }: { loading: boolean }) {
  return (
    <Skeleton
      name="catalog-cards"
      initialBones={bones}
      loading={loading}
      fixture={<FixtureRow />}
      select="viewport"
      color="#eaeaec"
      darkColor="#2c2c2e"
      className={loading ? "mt-6" : undefined}
      fallback={
        <div className="flex justify-center py-6 text-muted-foreground">
          <Loader2 aria-hidden className="size-5 animate-spin" />
        </div>
      }
    >
      {null}
    </Skeleton>
  );
}
