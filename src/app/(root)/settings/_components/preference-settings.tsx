"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { setCookie } from "cookies-next";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";

import type { ImageQuality, Lang } from "@/types";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { languages as languageList } from "@/config/languages";
import {
  useDownloadQuality,
  useImageQuality,
  useStreamQuality,
} from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import { QUALITIES_MAP } from "@/types";

const IMAGE_QUALITIES: ImageQuality[] = ["low", "medium", "high"];

type PreferenceSettingsProps = {
  initialLanguages: Lang[];
};

export function PreferenceSettings(props: PreferenceSettingsProps) {
  const router = useRouter();

  const [streamQuality, setStreamQuality] = useStreamQuality();
  const [downloadQuality, setDownloadQuality] = useDownloadQuality();
  const [imageQuality, setImageQuality] = useImageQuality();

  const [selectedLanguages, setSelectedLanguages] = React.useState(
    props.initialLanguages
  );

  function updateLanguages() {
    setCookie("language", selectedLanguages.join(","), {
      path: "/",
    });

    toast.success("Language Preferences updated!", {
      description: "Your language preferences have been updated.",
    });

    router.refresh();
  }

  return (
    <div className="space-y-8 px-6">
      <section id="language" className="space-y-4">
        <h3 className="font-heading text-lg drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-xl md:text-2xl">
          Languages
        </h3>

        <ToggleGroup
          type="multiple"
          value={selectedLanguages}
          onValueChange={(v) => setSelectedLanguages(v as Lang[])}
          className="flex max-w-5xl flex-wrap justify-normal gap-2"
        >
          {languageList.map((lang) => (
            <ToggleGroupItem
              key={lang}
              value={lang.toLowerCase()}
              variant="outline"
              className="w-24"
            >
              {lang}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Button size="sm" onClick={updateLanguages}>
          Save Preferences
        </Button>
      </section>

      <section className="space-y-2">
        <h3 className="pb-4 font-heading text-lg drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-xl md:text-2xl">
          Quality Settings
        </h3>

        <div
          id="stream-quality"
          className="flex max-w-xl items-center justify-between"
        >
          <h4 className="w-40 text-muted-foreground">Stream Quality</h4>

          <Separator className="w-20" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="group w-48 justify-between font-semibold capitalize"
              >
                <span>{streamQuality}</span>
                <span className="text-xs font-light">
                  (
                  {
                    QUALITIES_MAP.find((q) => q.quality === streamQuality)
                      ?.bitrate
                  }
                  )
                </span>

                <ChevronDown className="ml-2 size-4 transition-transform group-data-[state=open]:rotate-180" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-48 *:cursor-pointer *:capitalize">
              {QUALITIES_MAP.map(({ quality, bitrate }) => (
                <DropdownMenuItem
                  key={quality}
                  onClick={() => {
                    setStreamQuality(quality);

                    toast.success("Stream Quality updated!", {
                      description: `Stream quality set to "${quality}".`,
                    });
                  }}
                  className={cn(
                    "justify-between",
                    quality === downloadQuality && "bg-accent/60"
                  )}
                >
                  <span>{quality}</span>
                  <span className="text-xs font-medium">{bitrate}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div
          id="download-quality"
          className="flex max-w-xl items-center justify-between"
        >
          <h4 className="w-40 text-muted-foreground">Download Quality</h4>

          <Separator className="w-20" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="group w-48 justify-between font-semibold capitalize"
              >
                <span>{streamQuality}</span>
                <span className="text-xs font-light">
                  (
                  {
                    QUALITIES_MAP.find((q) => q.quality === downloadQuality)
                      ?.bitrate
                  }
                  )
                </span>
                <ChevronDown className="ml-2 size-4 transition-transform group-data-[state=open]:rotate-180" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-48 *:cursor-pointer *:capitalize">
              {QUALITIES_MAP.map(({ bitrate, quality }) => (
                <DropdownMenuItem
                  key={quality}
                  onClick={() => {
                    setDownloadQuality(quality);

                    toast.success("Download Quality updated!", {
                      description: `Download quality has been set to "${quality}".`,
                    });
                  }}
                  className={cn(
                    "justify-between",
                    quality === downloadQuality && "bg-accent/60"
                  )}
                >
                  <span>{quality}</span>
                  <span className="text-xs font-medium">{bitrate}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div
          id="image-quality"
          className="flex max-w-xl items-center justify-between"
        >
          <h4 className="w-40 text-muted-foreground">Image Quality</h4>

          <Separator className="w-20" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="group w-48 justify-between font-semibold capitalize"
              >
                {imageQuality}
                <ChevronDown className="ml-2 size-4 transition-transform group-data-[state=open]:rotate-180" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-48 *:cursor-pointer *:capitalize">
              {IMAGE_QUALITIES.map((quality) => (
                <DropdownMenuItem
                  key={quality}
                  onClick={() => {
                    setImageQuality(quality);

                    toast.success("Image Quality updated!", {
                      description: `Image quality has been set to "${quality}".`,
                    });
                  }}
                  className={cn(quality === imageQuality && "bg-accent/60")}
                >
                  {quality}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </section>
    </div>
  );
}
