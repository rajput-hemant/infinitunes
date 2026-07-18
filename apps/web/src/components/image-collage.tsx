import Image from "next/image";

import { cn } from "@/lib/utils";

export function ImageCollage({ src }: { src: string[] }) {
  return (
    <div
      className={cn(
        "h-full",
        src.length === 4 && "grid grid-cols-2 grid-rows-2 gap-0.5"
      )}
    >
      {src.map((image, i) => (
        <div key={i} className="relative h-full overflow-hidden rounded-md">
          <Image
            src={image}
            fill
            alt="Song cover"
            className={cn(
              src.length === 1 &&
                src[0].includes("placeholder") &&
                "dark:invert"
            )}
          />
        </div>
      ))}
    </div>
  );
}
