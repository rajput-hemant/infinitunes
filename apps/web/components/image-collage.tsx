import { ImageWithFallback } from "~/components/image-with-fallback";
import { getPlaceholderSrc } from "~/components/placeholder-src";
import { cn } from "~/lib/utils";

type ImageCollageProps = {
  src: string[];
};

function gridClassFor(count: number): string {
  if (count <= 1) return "grid grid-cols-1 grid-rows-1";
  if (count <= 4) return "grid grid-cols-2 grid-rows-2";
  return "grid grid-cols-3 grid-rows-3";
}

export function ImageCollage({ src }: ImageCollageProps) {
  const count = src.length;

  return (
    <div className={cn("h-full", gridClassFor(count), "gap-0.5")}>
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
