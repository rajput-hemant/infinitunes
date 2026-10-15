"use client";

import { MoreVertical } from "lucide-react";
import { useId, useState } from "react";

import { useDeferred } from "~/hooks/use-deferred";

import type { TileMoreEntry, TileMoreItem } from "./more-button-item";
import { moreTriggerClassName } from "./more-button-trigger";

type TileMoreDesktopProps = {
  item: TileMoreItem;
  showAlbum: boolean;
  entries: TileMoreEntry[];
  className?: string;
};

const loadPopup = () => import("./more-button-desktop-popup");

/**
 * The row's "more" dropdown from 768px. The menu (Base UI Menu, share submenu,
 * links) is a separate chunk: hover, focus, pointer down or an arrow key loads
 * it and swaps this identical closed trigger for the real one.
 */
export function TileMoreDesktop(props: TileMoreDesktopProps) {
  const name = `more-${useId()}`;
  const { mod, preload, intent } = useDeferred(name, loadPopup);
  const [clicked, setClicked] = useState(false);

  if (mod) {
    return (
      <mod.TileMoreDesktopPopup {...props} name={name} defaultOpen={clicked} />
    );
  }

  return (
    <div className="hidden md:block">
      <button
        type="button"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={false}
        data-slot="dropdown-menu-trigger"
        data-deferred={name}
        className={moreTriggerClassName("inline-flex", props.className)}
        {...intent}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            preload();
            setClicked(true);
          }
        }}
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
