"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { setCookie } from "cookies-next";
import { ChevronDown, Languages } from "lucide-react";
import { toast } from "sonner";

import type { Lang } from "@/types";

import { languages } from "@/config/languages";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";

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

    router.refresh();
  }

  return (
    <DropdownMenu onOpenChange={(o) => setIsOpen(o)}>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="hidden size-10 space-x-1 p-0 shadow-sm lg:inline-flex lg:w-auto lg:space-x-2 lg:p-2"
        >
          <Languages className="aspect-square h-5 lg:h-4" />
          <span className="hidden lg:inline-block">Languages</span>
          <ChevronDown
            className={cn(
              "hidden size-4 duration-300 lg:inline-block",
              isOpen && "rotate-180"
            )}
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuLabel className="p-4">
          <h1 className="font-heading text-lg drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-xl md:text-2xl">
            What music do you like?
          </h1>

          <small className="text-xs text-muted-foreground">
            Pick all the languages you want to listen to.
          </small>
        </DropdownMenuLabel>

        <ToggleGroup
          type="multiple"
          value={selectedLanguages}
          onValueChange={(v) => setSelectedLanguages(v as Lang[])}
          className="grid grid-cols-2 border-y py-2"
        >
          {languages.map((lang) => (
            <ToggleGroupItem
              key={lang}
              value={lang.toLowerCase()}
              variant="outline"
            >
              {lang}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <DropdownMenuItem className="rounded-none focus:bg-transparent">
          <Button onClick={updateLanguages} className="w-full text-lg">
            Save
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
