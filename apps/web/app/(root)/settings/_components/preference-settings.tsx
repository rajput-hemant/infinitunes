"use client";

import type { ImageQuality, Lang } from "@infinitunes/types";
import { QUALITIES_MAP } from "@infinitunes/types";
import { Button } from "@infinitunes/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@infinitunes/ui/components/dropdown-menu";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@infinitunes/ui/components/toggle-group";
import { setCookie } from "cookies-next";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

import { languages as languageList } from "~/config/languages";
import {
  useDownloadQuality,
  useImageQuality,
  useKeyboardShortcuts,
  useStreamQuality,
} from "~/hooks/use-store";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

import { SettingsRow, SettingsSection, SwitchRow } from "./settings-section";

const IMAGE_QUALITIES: ImageQuality[] = ["low", "medium", "high"];

type QualityOption<T extends string> = { value: T; detail?: string };

type QualityRowProps<T extends string> = {
  id: string;
  label: string;
  help: string;
  value: T;
  detail?: string;
  options: readonly QualityOption<T>[];
  onSelect: (value: T) => void;
};

function QualityRow<T extends string>(props: QualityRowProps<T>) {
  const { id, label, help, value, detail, options, onSelect } = props;

  return (
    <SettingsRow id={id} label={label} help={help}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              aria-label={`${label}: ${value}`}
              className={cn(
                controlStyles.text,
                "group w-48 justify-between capitalize",
              )}
            >
              <span>
                {value}
                {detail && (
                  <span className="ml-2 text-xs font-light">({detail})</span>
                )}
              </span>
              <ChevronDown
                aria-hidden
                className="size-4 transition-transform group-data-[state=open]:rotate-180"
              />
            </Button>
          }
        />

        <DropdownMenuContent className="w-48 *:cursor-pointer *:capitalize">
          {options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onSelect(option.value)}
              className={cn(
                "justify-between",
                option.value === value && "bg-fill-2",
              )}
            >
              <span>{option.value}</span>
              {option.detail && (
                <span className="text-xs font-medium">{option.detail}</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SettingsRow>
  );
}

const audioOptions = QUALITIES_MAP.map(({ quality, bitrate }) => ({
  value: quality,
  detail: bitrate,
}));
const imageOptions = IMAGE_QUALITIES.map((value) => ({ value }));

const bitrateOf = (quality: string) =>
  QUALITIES_MAP.find((q) => q.quality === quality)?.bitrate;

type PreferenceSettingsProps = {
  initialLanguages: Lang[];
};

export function PreferenceSettings(props: PreferenceSettingsProps) {
  const router = useRouter();

  const [streamQuality, setStreamQuality] = useStreamQuality();
  const [downloadQuality, setDownloadQuality] = useDownloadQuality();
  const [imageQuality, setImageQuality] = useImageQuality();
  const [shortcutsEnabled, setShortcutsEnabled] = useKeyboardShortcuts();

  const [selectedLanguages, setSelectedLanguages] = React.useState(
    props.initialLanguages,
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
    <>
      <SettingsSection
        id="language"
        title="Languages"
        description="Pick the languages you want on Home, Charts and New releases."
      >
        <ToggleGroup
          aria-label="Languages"
          value={selectedLanguages}
          onValueChange={(v) => setSelectedLanguages(v as Lang[])}
          className="flex max-w-5xl flex-wrap justify-normal gap-2"
        >
          {languageList.map((lang) => (
            <ToggleGroupItem
              key={lang}
              value={lang.toLowerCase()}
              className={cn(
                controlStyles.text,
                "min-w-20 rounded-sm bg-fill text-sm font-medium hover:bg-fill-2 aria-pressed:bg-primary/10 aria-pressed:inset-ring-2 aria-pressed:inset-ring-primary",
              )}
            >
              {lang}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div>
          <Button className={controlStyles.textLg} onClick={updateLanguages}>
            Save Preferences
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection id="quality" title="Quality Settings">
        <div>
          <QualityRow
            id="stream-quality"
            label="Stream Quality"
            help="Higher quality uses more data."
            value={streamQuality}
            detail={bitrateOf(streamQuality)}
            options={audioOptions}
            onSelect={(quality) => {
              setStreamQuality(quality);
              toast.success("Stream Quality updated!", {
                description: `Stream quality set to "${quality}".`,
              });
            }}
          />
          <QualityRow
            id="download-quality"
            label="Download Quality"
            help="Used for every download."
            value={downloadQuality}
            detail={bitrateOf(downloadQuality)}
            options={audioOptions}
            onSelect={(quality) => {
              setDownloadQuality(quality);
              toast.success("Download Quality updated!", {
                description: `Download quality has been set to "${quality}".`,
              });
            }}
          />
          <QualityRow
            id="image-quality"
            label="Image Quality"
            help="Artwork resolution across the app."
            value={imageQuality}
            options={imageOptions}
            onSelect={(quality) => {
              setImageQuality(quality);
              toast.success("Image Quality updated!", {
                description: `Image quality has been set to "${quality}".`,
              });
            }}
          />
        </div>
      </SettingsSection>

      <SettingsSection id="keyboard-shortcuts" title="Keyboard">
        <SwitchRow
          label="Keyboard shortcuts"
          help="Space, N, P, L and S control the player; Shift with the arrow keys skips tracks and changes volume."
          checked={shortcutsEnabled}
          onCheckedChange={(checked) => {
            setShortcutsEnabled(checked);
            toast.success(
              checked
                ? "Keyboard shortcuts turned on"
                : "Keyboard shortcuts turned off",
            );
          }}
        />
      </SettingsSection>
    </>
  );
}
