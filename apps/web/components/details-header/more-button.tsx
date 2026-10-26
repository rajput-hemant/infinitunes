"use client";

import type { PlaylistSummary } from "@infinitunes/core/react/optimistic-playlists";
import type { MediaType, Quality, SongRowItem } from "@infinitunes/types";
import { MoreVertical, Share2 } from "lucide-react";
import { useId, useState } from "react";

import { useDeferred } from "~/hooks/use-deferred";
import type { User } from "~/lib/auth";

import { headerIconClassName } from "./header-icon";
import type { MoreButtonPopupProps } from "./more-button-popup";

export type MoreButtonProps = {
  user?: User;
  type: MediaType;
  image: Quality;
  name: string;
  subtitle: string;
  songs: SongRowItem[];
  playlists?: PlaylistSummary[];
  artistId?: string;
  language?: string;
};

type Opened = MoreButtonPopupProps["openOnMount"];

const loadPopup = () => import("./more-button-popup");

/**
 * The details header's Share and "more" buttons. Their popups (Base UI Menu,
 * Drawer, the Add-to-playlist dialog) are one chunk loaded on the first hover,
 * focus, pointer down or arrow key; until then the page carries identical
 * closed triggers. A click before the chunk lands opens the popup on arrival.
 */
export function MoreButton(props: MoreButtonProps) {
  const id = useId();
  const names = {
    share: `share-${id}`,
    mobile: `details-more-m-${id}`,
    desktop: `details-more-${id}`,
  };
  // One deferred per trigger, so focus returns to the very one that had it.
  const share = useDeferred(names.share, loadPopup);
  const mobile = useDeferred(names.mobile, loadPopup);
  const desktop = useDeferred(names.desktop, loadPopup);
  const [opened, setOpened] = useState<Opened>(null);

  const mod = share.mod ?? mobile.mod ?? desktop.mod;
  if (mod) {
    return (
      <mod.MoreButtonPopup {...props} names={names} openOnMount={opened} />
    );
  }

  function open(which: Exclude<Opened, null>, deferred: typeof share) {
    deferred.preload();
    setOpened(which);
  }

  return (
    <>
      <button
        type="button"
        aria-label="Share"
        aria-haspopup="menu"
        aria-expanded={false}
        data-slot="dropdown-menu-trigger"
        data-deferred={names.share}
        className={headerIconClassName}
        {...share.intent}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            open("share", share);
          }
        }}
        onClick={() => open("share", share)}
      >
        <Share2 aria-hidden="true" className="size-5" />
      </button>

      <div className="md:hidden">
        <button
          type="button"
          aria-label="More options"
          aria-haspopup="dialog"
          aria-expanded={false}
          data-slot="drawer-trigger"
          data-deferred={names.mobile}
          className={headerIconClassName}
          {...mobile.intent}
          onClick={() => open("mobile", mobile)}
        >
          <MoreVertical aria-hidden="true" className="size-5" />
        </button>
      </div>

      <div className="hidden md:block">
        <button
          type="button"
          aria-label="More options"
          aria-haspopup="menu"
          aria-expanded={false}
          data-slot="dropdown-menu-trigger"
          data-deferred={names.desktop}
          className={headerIconClassName}
          {...desktop.intent}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              open("desktop", desktop);
            }
          }}
          onClick={() => open("desktop", desktop)}
        >
          <MoreVertical aria-hidden="true" className="size-5" />
        </button>
      </div>
    </>
  );
}
