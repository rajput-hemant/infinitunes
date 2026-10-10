import { getImageSrc } from "@infinitunes/types";
import type { Quality } from "@infinitunes/types";
import type { Route } from "next";
import Link from "next/link";

import { ImageWithFallback } from "~/components/image-with-fallback";
import { getPlaceholderSrc } from "~/components/placeholder-src";
import { cn } from "~/lib/utils";

type BrowseTileProps = {
  href: Route;
  title: string;
  background: string;
  image?: Quality;
  className?: string;
};

export function BrowseTile({
  href,
  title,
  background,
  image,
  className,
}: BrowseTileProps) {
  return (
    <Link
      href={href}
      style={{ background }}
      className={cn(
        "group relative isolate flex h-24 items-start overflow-hidden rounded-md p-4 text-base leading-6 font-bold tracking-[-0.01em] text-white transition duration-fast ease-out hover:brightness-[1.06] active:scale-98 motion-reduce:transition-none",
        className,
      )}
    >
      {title}

      {image && (
        <ImageWithFallback
          src={getImageSrc(image, "high")}
          fallback={getPlaceholderSrc("playlist")}
          width={72}
          height={72}
          alt=""
          className="absolute -right-3 -bottom-3 -z-10 size-18 rotate-[18deg] rounded-sm shadow-md"
        />
      )}
    </Link>
  );
}
