"use client";

import * as React from "react";

import { useDeferred } from "~/hooks/use-deferred";

type TriggerProps = React.HTMLAttributes<HTMLElement> & {
  "data-slot"?: string;
  "data-deferred"?: string;
};

type NewPlaylistFormProps = {
  /** The single element that opens the dialog. */
  children: React.ReactElement<TriggerProps>;
};

const loadPopup = () => import("./new-playlist-popup");

/** Runs the trigger's own handler, then ours. */
function chain<E>(theirs: ((event: E) => void) | undefined, ours: () => void) {
  return (event: E) => {
    theirs?.(event);
    ours();
  };
}

/**
 * Wraps the element that opens the "Create Playlist" dialog. The dialog (Base
 * UI Dialog and Drawer) is a separate chunk: the first hover, focus or pointer
 * down loads it and swaps this identical closed trigger for the real one. A
 * click before that opens the dialog once it lands.
 */
export function NewPlaylistForm({ children }: NewPlaylistFormProps) {
  const name = `new-playlist-${React.useId()}`;
  const { mod, preload } = useDeferred(name, loadPopup);
  const [clicked, setClicked] = React.useState(false);

  if (mod) {
    return (
      <mod.NewPlaylistPopup name={name} defaultOpen={clicked}>
        {children}
      </mod.NewPlaylistPopup>
    );
  }

  const own = children.props;

  return React.cloneElement(children, {
    "aria-haspopup": "dialog",
    "aria-expanded": false,
    "data-slot": "dialog-trigger",
    "data-deferred": name,
    onPointerEnter: chain(own.onPointerEnter, preload),
    onPointerDown: chain(own.onPointerDown, preload),
    onFocus: chain(own.onFocus, preload),
    onClick: chain(own.onClick, () => {
      preload();
      setClicked(true);
    }),
  });
}
