"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { H3 } from "@/components/ui/topography";
import { Language, languages as languageList } from "@/config/languages";
import {
  useConfig,
  useDownloadQuality,
  useImageQuality,
  useStreamQuality,
} from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import { ImageQuality, StreamQuality } from "@/types";

const songQualities: StreamQuality[] = [
  "poor",
  "low",
  "medium",
  "high",
  "excellent",
];

const imageQualities: ImageQuality[] = ["low", "medium", "high"];

export function PreferenceSettings() {
  const [config, setConfig] = useConfig();
  const [streamQuality, setStreamQuality] = useStreamQuality();
  const [downloadQuality, setDownloadQuality] = useDownloadQuality();
  const [imageQuality, setImageQuality] = useImageQuality();

  function toggleLanguage(lang: Language) {
    if (config.languages.includes(lang)) {
      setConfig((prev) => ({
        ...prev,
        languages: config.languages.filter((l) => l !== lang),
      }));
    } else {
      setConfig((prev) => ({
        ...prev,
        languages: [...config.languages, lang],
      }));
    }
  }

  return (
    <div className="space-y-4">
      {/* languages */}
      <H3 id="language">Languages</H3>
      <div className="flex max-w-5xl flex-wrap gap-2">
        {languageList.map((l) => {
          const lang = l.toLowerCase() as Language;

          return (
            <Toggle
              key={lang}
              title={lang}
              variant="outline"
              pressed={config.languages.includes(lang)}
              onPressedChange={() => toggleLanguage(lang)}
              className="data-[state=on]:border-primary w-24 capitalize data-[state=on]:border-2"
            >
              {lang}
            </Toggle>
          );
        })}
      </div>

      {/* stream quality */}
      <H3 id="stream-quality">Stream Quality</H3>
      <div className="flex max-w-5xl flex-wrap gap-2">
        {songQualities.map((quality) => (
          <Button
            key={quality}
            size="sm"
            variant="outline"
            onClick={() => setStreamQuality(quality)}
            className={cn(
              "w-24 capitalize",
              streamQuality === quality && "border-primary border-2"
            )}
          >
            {quality}
          </Button>
        ))}
      </div>

      {/* download quality */}
      <H3 id="download-quality">Download Quality</H3>
      <div className="flex max-w-5xl flex-wrap gap-2">
        {songQualities.map((quality) => (
          <Button
            key={quality}
            size="sm"
            variant="outline"
            onClick={() => setDownloadQuality(quality)}
            className={cn(
              "w-24 capitalize",
              downloadQuality === quality && "border-primary border-2"
            )}
          >
            {quality}
          </Button>
        ))}
      </div>

      {/* image quality */}
      <H3 id="image-quality">Image Quality</H3>
      <div className="flex max-w-5xl flex-wrap gap-2">
        {imageQualities.map((quality) => (
          <Button
            key={quality}
            size="sm"
            variant="outline"
            onClick={() => setImageQuality(quality)}
            className={cn(
              "w-24 capitalize",
              imageQuality === quality && "border-primary border-2"
            )}
          >
            {quality}
          </Button>
        ))}
      </div>
    </div>
  );
}
