/**
 * The high-contrast field the settings previews put glass over: stripes and
 * discs in theme colours, so the bend of the rim is easy to see. Decorative
 * only: the glass samples whatever sits behind it.
 */
export function GlassBackdrop() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 -z-10 bg-muted bg-[repeating-linear-gradient(90deg,var(--foreground)_0_2px,transparent_2px_22px)]"
    >
      <span className="absolute -top-8 left-[38%] size-36 rounded-full bg-foreground/35" />
      <span className="absolute right-[6%] bottom-4 size-28 rounded-full bg-foreground/55" />
      <span className="absolute top-5 left-[6%] size-20 rounded-full bg-background/80" />
    </div>
  );
}
