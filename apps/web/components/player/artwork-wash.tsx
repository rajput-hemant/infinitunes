import { getImageSrc } from "@infinitunes/types";
import type { Queue } from "@infinitunes/types";

import { ImageWithFallback } from "~/components/image-with-fallback";

type ArtworkWashProps = { image: Queue["image"] };

/** The artwork, blurred and saturated, lighting the layer behind the content. */
export function ArtworkWash({ image }: ArtworkWashProps) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <ImageWithFallback
        src={getImageSrc(image, "high")}
        alt=""
        fill
        sizes="100vw"
        fallback="/images/placeholder/song.jpg"
        className="scale-125 rounded-none object-cover opacity-70 blur-2xl saturate-[1.6]"
      />
      <div className="absolute inset-0 bg-background/40" />
    </div>
  );
}
