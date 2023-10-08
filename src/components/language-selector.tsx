"use client";

import { useState } from "react";
import { ChevronDown, Languages } from "lucide-react";

import { Lang } from "@/types";
import { cn } from "@/lib/utils";
import { useConfig } from "@/hooks/use-config";
import { Button, buttonVariants } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Toggle } from "./ui/toggle";
import { Large, Muted } from "./ui/topography";
import { useToast } from "./ui/use-toast";

const LANGUAGES = [
  "Hindi",
  "English",
  "Punjabi",
  "Tamil",
  "Telugu",
  "Marathi",
  "Gujarati",
  "Bengali",
  "Kannada",
  "Bhojpuri",
  "Malayalam",
  "Urdu",
  "Haryanvi",
  "Rajasthani",
  "Odia",
  "Assamese",
] as const;

const LanguageSelector = () => {
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [config] = useConfig();
  const [selected, setSelected] = useState<Lang[]>(config.languages);

  function toggleLanguage(lang: Lang) {
    if (selected.includes(lang)) {
      setSelected(selected.filter((l) => l !== lang));
    } else {
      setSelected([...selected, lang]);
    }
  }

  function updateLanguage() {
    // setConfig({
    //   ...config,
    //   languages: selected,
    // });

    // toast({
    //   title: "Languages updated",
    //   description: "Your language preferences have been updated.",
    // });

    // router.refresh();

    toast({
      title: "Coming soon",
      description: "This feature is in development.",
    });
  }

  return (
    <DropdownMenu onOpenChange={(isOpen) => setIsOpen(isOpen)}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-10 w-10 space-x-1 p-0 lg:w-auto lg:space-x-2 lg:p-2"
        >
          <Languages className="aspect-square h-5 lg:h-4" />

          <span className="hidden lg:inline-block">Languages</span>

          <ChevronDown
            className={cn(
              "hidden h-4 w-4 duration-300 lg:inline-block",
              isOpen && "rotate-180"
            )}
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuLabel className="p-4">
          <Large>What music do you like?</Large>

          <Muted className="text-xs font-medium">
            Pick all the languages you want to listen to.
          </Muted>
        </DropdownMenuLabel>

        <div className="grid grid-cols-2">
          {LANGUAGES.map((l) => {
            const lang = l.toLowerCase() as Lang;

            return (
              <div
                key={lang}
                className="border-border/50 p-1 odd:border-r odd:border-t even:border-t"
              >
                <Toggle
                  pressed={selected.includes(lang)}
                  onPressedChange={() => toggleLanguage(lang)}
                  className="w-full"
                >
                  {l}
                </Toggle>
              </div>
            );
          })}
        </div>

        <DropdownMenuItem onClick={updateLanguage} className="border-t p-0">
          <Large className={cn(buttonVariants(), "m-2 w-full")}>Save</Large>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
