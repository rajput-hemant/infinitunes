"use client";

import type { Lang } from "@infinitunes/types";
import { Button } from "@infinitunes/ui/components/button";
import { useState } from "react";

import { useDeferred } from "~/hooks/use-deferred";

import {
  LanguageTriggerContent,
  languageTriggerProps,
} from "./language-trigger";

type LanguagePickerProps = {
  /** Seeds the selection when no `language` cookie is set. */
  initialLanguages?: Lang[];
};

const loadPopup = () => import("./language-popup");

/**
 * The toolbar's language button. The Popover and Drawer behind it are a
 * separate chunk: the first hover, focus or pointer down loads it and swaps
 * this identical closed trigger for the real one. A click before that opens
 * the popup as soon as it lands.
 */
export function LanguagePicker({ initialLanguages }: LanguagePickerProps) {
  const { mod, preload, intent } = useDeferred("languages", loadPopup);
  const [clicked, setClicked] = useState(false);

  if (mod) {
    return (
      <mod.LanguagePopup
        initialLanguages={initialLanguages}
        defaultOpen={clicked}
      />
    );
  }

  return (
    <Button
      {...languageTriggerProps}
      type="button"
      aria-haspopup="dialog"
      aria-expanded={false}
      data-slot="popover-trigger"
      {...intent}
      onClick={() => {
        preload();
        setClicked(true);
      }}
    >
      <LanguageTriggerContent isOpen={false} />
    </Button>
  );
}
