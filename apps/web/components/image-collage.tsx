import { cn } from "~/lib/utils";

import { ImageWithFallback } from "../image-with-fallback";
import { getPlaceholderSrc } from "../placeholder-src";

export function ImageCollage({ src }: { src: string[] }) {
  const count = src.length;

  const gridClass =
    count <= 1
      ? "grid grid-cols-1 grid-rows-1"
      : count === 2
        ? "grid grid-cols-2 grid-rows-2"
        : count === 3
          ? "grid grid-cols-2 grid-rows-2"
          : count === 4
            ? "grid grid-cols-2 grid-rows-2"
            : "grid grid-cols-3 grid-rows-3";

  return (
    <div className={cn("h-full", gridClass, "gap-0.5")}>
      {src.map((image, i) => (
        <div
          key={i}
          className={cn(
            "relative h-full overflow-hidden rounded-md",
            count === 3 && i === 0 && "row-span-2",
          )}
        >
          <ImageWithFallback
            src={image}
            fill
            sizes="(min-width: 1280px) 256px, (min-width: 768px) 224px, 176px"
            alt="Song cover"
            fallback={getPlaceholderSrc("song")}
            className={cn(
              "object-cover",
              count === 1 && image.includes("placeholder") && "dark:invert",
            )}
          />
        </div>
      ))}
    </div>
  );
}
