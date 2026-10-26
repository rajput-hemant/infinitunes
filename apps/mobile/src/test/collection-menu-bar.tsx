import { useState } from "react";

import type { CollectionMenuSpec } from "~/components/collection-menu";
import { detailHeaderOptions } from "~/components/detail/detail-header-options";
import { DetailMenu, DetailMenuContext } from "~/components/detail/detail-menu";
import type { HeaderMenu } from "~/components/detail/detail-menu";

/**
 * A detail page's bar: `DetailMenu` hands its entries to the header options
 * (what `DetailFrame` does) and the bar's `headerRight` (Share, then the
 * "More actions for <name>" menu) is rendered.
 */
export function CollectionMenuBar(spec: CollectionMenuSpec) {
  const [menu, setMenu] = useState<HeaderMenu>();
  const options = detailHeaderOptions(
    {
      name: spec.name,
      type: "album",
      url: "https://www.jiosaavn.com/album/a/b",
    },
    undefined,
    menu,
  );
  return (
    <DetailMenuContext value={setMenu}>
      <DetailMenu {...spec} />
      {options.headerRight?.({ canGoBack: true })}
    </DetailMenuContext>
  );
}
