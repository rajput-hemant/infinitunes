import Image from "next/image";

import { cn } from "~/lib/utils";

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
          <Image
            src={image}
            fill
            alt="Song cover"
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
