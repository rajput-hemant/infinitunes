"use client";

import type { Lang } from "@infinitunes/types";
import { Button } from "@infinitunes/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@infinitunes/ui/components/popover";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@infinitunes/ui/components/toggle-group";
import { setCookie } from "cookies-next";
import { ChevronDown, Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

import { languages } from "~/config/languages";
import { cn } from "~/lib/utils";

type LanguagePickerProps = {
  initialLanguages: Lang[];
};

export function LanguagePicker({ initialLanguages }: LanguagePickerProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedLanguages, setSelectedLanguages] =
    React.useState(initialLanguages);

  function updateLanguages() {
    setCookie("language", selectedLanguages.join(","), {
      path: "/",
    });

    toast.success("Preferences updated!", {
      description: "Your language preferences have been updated.",
    });

    setIsOpen(false);
    router.refresh();
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        render={
          <Button
            size="sm"
            variant="outline"
            className="size-10 space-x-1 p-0 shadow-xs lg:w-auto lg:space-x-2 lg:p-2"
          >
            <Languages className="aspect-square h-5 lg:h-4" />
            <span className="hidden lg:inline-block">Languages</span>
            <ChevronDown
              className={cn(
                "hidden size-4 duration-300 lg:inline-block",
                isOpen && "rotate-180",
              )}
            />
          </Button>
        }
      />

      <PopoverContent
        align="end"
        className="w-auto min-w-[18.5625rem] gap-0 p-0"
      >
        <PopoverHeader className="p-4">
          <PopoverTitle className="font-heading text-lg text-foreground sm:text-xl md:text-2xl">
            What music do you like?
          </PopoverTitle>

          <PopoverDescription className="text-xs">
            Pick all the languages you want to listen to.
          </PopoverDescription>
        </PopoverHeader>

        <ToggleGroup
          value={selectedLanguages}
          onValueChange={(v) => setSelectedLanguages(v as Lang[])}
          aria-label="Languages"
          className="grid w-full grid-cols-2 border-y p-2"
        >
          {languages.map((lang) => (
            <ToggleGroupItem
              key={lang}
              value={lang.toLowerCase()}
              variant="outline"
              className="h-10 min-w-[4.4375rem] px-4"
            >
              {lang}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="p-2">
          <Button onClick={updateLanguages} className="w-full text-lg">
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
