import { Play } from "lucide-react";

import { GlassSurface } from "~/components/glass/glass-surface";

import { GlassBackdrop } from "./glass-backdrop";

/** A live sample of the glass the tuning controls change. Decorative: the controls carry the meaning. */
export function GlassDemo() {
  return (
    <div
      aria-hidden
      className="relative isolate grid h-60 overflow-hidden rounded-lg"
    >
      <GlassBackdrop />
      <span className="absolute top-9 left-5 -z-10 font-heading text-5xl/none font-extrabold tracking-tight text-primary-foreground">
        Liquid
        <br />
        Glass
      </span>

      <GlassSurface
        size="m"
        className="absolute bottom-4 left-4 grid w-60 max-w-[55%] gap-1 rounded-3xl p-4"
      >
        <b className="text-base">Now Playing</b>
        <small className="text-muted-foreground">
          Glass over a colourful backdrop
        </small>
      </GlassSurface>

      <GlassSurface
        size="m"
        className="absolute top-5 right-5 grid size-14 place-items-center rounded-full"
      >
        <Play className="size-5 fill-current" />
      </GlassSurface>

      <GlassSurface
        size="m"
        className="absolute right-4 bottom-5 flex h-11 items-center gap-4 rounded-full px-5 font-semibold"
      >
        <span>Regular</span>
        <span>Clear</span>
      </GlassSurface>
    </div>
  );
}
