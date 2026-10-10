/**
 * The vivid colour field the settings previews put glass over. Decorative
 * only: the glass samples whatever sits behind it.
 */
export function GlassBackdrop() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 -z-10 bg-linear-to-br from-primary via-accent to-primary/60"
    >
      <span className="absolute -top-8 left-[38%] size-36 rounded-full bg-accent blur-[2px]" />
      <span className="absolute right-[6%] bottom-4 size-28 rounded-full bg-primary-foreground/60 blur-[2px]" />
      <span className="absolute top-5 left-[6%] size-20 rounded-full bg-foreground/40 blur-[2px]" />
    </div>
  );
}
