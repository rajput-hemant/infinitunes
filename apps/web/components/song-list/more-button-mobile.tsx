"use client";

import { MoreVertical } from "lucide-react";
import { useId, useState } from "react";

import { useDeferred } from "~/hooks/use-deferred";

import type { TileMoreEntry, TileMoreItem } from "./more-button-item";
import { moreTriggerClassName } from "./more-button-trigger";

type TileMoreMobileProps = {
  item: TileMoreItem;
  showAlbum: boolean;
  entries: TileMoreEntry[];
  className?: string;
};

const loadPopup = () => import("./more-button-mobile-popup");

/**
 * The row's "more" button below 768px. The bottom sheet (Base UI Drawer, share
 * panel) is a separate chunk loaded on the first hover, focus or pointer down.
 */
export function TileMoreMobile(props: TileMoreMobileProps) {
  const name = `more-m-${useId()}`;
  const { mod, preload, intent } = useDeferred(name, loadPopup);
  const [clicked, setClicked] = useState(false);

  if (mod) {
    return (
      <mod.TileMoreMobilePopup {...props} name={name} defaultOpen={clicked} />
    );
  }

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="More options"
        aria-haspopup="dialog"
        aria-expanded={false}
        data-slot="drawer-trigger"
        data-deferred={name}
        className={moreTriggerClassName("flex", props.className)}
        {...intent}
        onClick={() => {
          preload();
          setClicked(true);
        }}
      >
        <MoreVertical aria-hidden="true" className="size-5" />
      </button>
    </div>
  );
}
