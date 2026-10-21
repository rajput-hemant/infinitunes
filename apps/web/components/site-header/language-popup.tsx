"use client";

import type { Lang } from "@infinitunes/types";
import { isLang, parseLanguages } from "@infinitunes/types";
import { Button } from "@infinitunes/ui/components/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@infinitunes/ui/components/drawer";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@infinitunes/ui/components/popover";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@infinitunes/ui/components/toggle-group";
import { getCookie, setCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { searchUi } from "~/components/search/search-ui";
import { languages } from "~/config/languages";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

import {
  LanguageTriggerContent,
  languageTriggerProps,
} from "./language-trigger";
import { useIsPhone } from "./use-is-phone";

type LanguagePopupProps = {
  /** Seeds the selection when no `language` cookie is set. */
  initialLanguages?: Lang[];
  /** The shell was clicked before this chunk arrived: open at once. */
  defaultOpen?: boolean;
};

/** The saved choice, read in the browser so the server render never needs the cookie. */
function savedLanguages(): Lang[] | undefined {
  const saved = getCookie("language");

  return typeof saved === "string" ? parseLanguages(saved) : undefined;
}

/** The real popup (Popover from 768px, Drawer below), loaded on intent by `LanguagePicker`. */
export function LanguagePopup({
  initialLanguages = [],
  defaultOpen = false,
}: LanguagePopupProps) {
  const router = useRouter();
  const isPhone = useIsPhone();

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [appliedLanguages, setAppliedLanguages] = useState(initialLanguages);
  const [selectedLanguages, setSelectedLanguages] = useState(initialLanguages);

  // Opened by an early click: the open handler below never ran, so read the cookie now.
  useEffect(() => {
    if (!defaultOpen) return;
    const saved = savedLanguages();
    if (saved) {
      setAppliedLanguages(saved);
      setSelectedLanguages(saved);
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- once, on mount
  }, []);

  // Closing without saving discards the unsaved selection.
  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (!open) {
      setSelectedLanguages(appliedLanguages);
      return;
    }

    // Opening picks up the cookie, which the layout no longer reads on the server.
    const saved = savedLanguages();
    if (saved) {
      setAppliedLanguages(saved);
      setSelectedLanguages(saved);
    }
  }

  function updateLanguages() {
    setAppliedLanguages(selectedLanguages);
    setCookie("language", selectedLanguages.join(","), {
      path: "/",
    });

    toast.success("Preferences updated!", {
      description: "Your language preferences have been updated.",
    });

    setIsOpen(false);
    router.refresh();
  }

  const trigger = <Button {...languageTriggerProps} />;

  const triggerContent = <LanguageTriggerContent isOpen={isOpen} />;

  const choices = (
    <LanguageChoices
      selected={selectedLanguages}
      onSelectedChange={setSelectedLanguages}
      onSave={updateLanguages}
    />
  );

  if (isPhone) {
    return (
      <Drawer open={isOpen} onOpenChange={handleOpenChange} showSwipeHandle>
        <DrawerTrigger render={trigger}>{triggerContent}</DrawerTrigger>

        <DrawerContent className="rounded-t-3xl pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="flex flex-col gap-3 p-4">
            <div>
              <DrawerTitle className="text-base font-bold">
                Languages
              </DrawerTitle>
              <DrawerDescription className="text-xs">
                {LANGUAGES_HINT}
              </DrawerDescription>
            </div>

            {choices}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger render={trigger}>{triggerContent}</PopoverTrigger>

      <PopoverContent align="end" className="w-80 gap-3 p-4">
        <div>
          <PopoverTitle className="text-base font-bold text-foreground">
            Languages
          </PopoverTitle>
          <PopoverDescription className="text-xs">
            {LANGUAGES_HINT}
          </PopoverDescription>
        </div>

        {choices}
      </PopoverContent>
    </Popover>
  );
}

const LANGUAGES_HINT = "Shapes Home, Charts and New releases.";

type LanguageChoicesProps = {
  selected: Lang[];
  onSelectedChange: (languages: Lang[]) => void;
  onSave: () => void;
};

function LanguageChoices({
  selected,
  onSelectedChange,
  onSave,
}: LanguageChoicesProps) {
  return (
    <>
      <ToggleGroup
        multiple
        value={selected}
        onValueChange={(v) => onSelectedChange(v.filter(isLang))}
        aria-label="Languages"
        className="flex w-full flex-wrap justify-start gap-2"
      >
        {languages.map((lang) => (
          <ToggleGroupItem
            key={lang}
            value={lang.toLowerCase()}
            className={cn(
              controlStyles.text,
              searchUi.chip,
              "aria-pressed:bg-foreground aria-pressed:text-background",
            )}
          >
            {lang}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <Button onClick={onSave} className={cn(controlStyles.text, "w-full")}>
        Save
      </Button>
    </>
  );
}
