import { splitLabelSlug } from "@infinitunes/core/entity-route";
import type { Metadata } from "next";
import { Suspense } from "react";

import { DetailsHeader } from "~/components/details-header/details-header";
import { DetailsHeaderSkeleton } from "~/components/details-header/details-header-skeleton";

import { getLabel, labelTabMetadata } from "./_components/label-data";
import { LabelTabsSkeleton } from "./_components/label-skeleton";
import { LabelTabNav } from "./_components/label-tab-nav";

type LabelLayoutProps = LayoutProps<"/label/[name]/[token]">;
type LabelParams = LabelLayoutProps["params"];

export async function generateMetadata({
  params,
}: LabelLayoutProps): Promise<Metadata> {
  const { name, token } = await params;

  // Songs, the bare route, is the label's canonical; Albums overrides it.
  return labelTabMetadata(await getLabel(token), name, token, "songs");
}

async function LabelHeader({ params }: { params: LabelParams }) {
  const { token } = await params;

  return <DetailsHeader item={await getLabel(token)} />;
}

async function LabelTabs({ params }: { params: LabelParams }) {
  const { name, token } = await params;

  return <LabelTabNav name={splitLabelSlug(name).name} token={token} />;
}

/**
 * The label frame, the artist's pattern. The tabs are child routes (Songs on
 * the bare route, `/albums`), so the header and tab row stay mounted across tab
 * switches and only the panel in `children` suspends; only the active panel is
 * rendered and shipped.
 */
export default function LabelLayout({ children, params }: LabelLayoutProps) {
  return (
    <div className="flex flex-col gap-(--page-gap)">
      <Suspense fallback={<DetailsHeaderSkeleton type="label" />}>
        <LabelHeader params={params} />
      </Suspense>

      <div className="flex flex-col gap-2">
        <Suspense fallback={<LabelTabsSkeleton />}>
          <LabelTabs params={params} />
        </Suspense>

        {children}
      </div>
    </div>
  );
}
