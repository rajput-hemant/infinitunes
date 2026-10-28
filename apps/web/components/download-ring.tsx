import { cn } from "~/lib/utils";

type DownloadRingProps = {
  /** 0..1, or `null` when the size is unknown (a quarter arc that spins). */
  fraction: number | null;
  /** Makes the ring a labelled progressbar; without it the ring is decoration. */
  label?: string;
  className?: string;
};

const INDETERMINATE_ARC = 0.25;

/** A thin progress ring in the accent colour. Under reduced motion it is the static arc. */
export function DownloadRing({
  fraction,
  label,
  className,
}: DownloadRingProps) {
  const arc = fraction ?? INDETERMINATE_ARC;

  return (
    <svg
      viewBox="0 0 20 20"
      role={label ? "progressbar" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      aria-valuemin={label ? 0 : undefined}
      aria-valuemax={label ? 100 : undefined}
      aria-valuenow={
        label && fraction !== null ? Math.round(fraction * 100) : undefined
      }
      className={cn(
        "size-4 text-primary",
        fraction === null && "motion-safe:animate-spin",
        className,
      )}
    >
      <circle
        cx="10"
        cy="10"
        r="8"
        fill="none"
        strokeWidth="2"
        className="stroke-current opacity-20"
      />
      <circle
        cx="10"
        cy="10"
        r="8"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        pathLength="100"
        strokeDasharray={`${arc * 100} 100`}
        transform="rotate(-90 10 10)"
        className="stroke-current transition-[stroke-dasharray] duration-fast ease-out motion-reduce:transition-none"
      />
    </svg>
  );
}
