import { cn } from "@/lib/utils";

const Skeleton = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "h-full w-full animate-pulse rounded-md bg-black/10 dark:bg-white/10",
        className
      )}
      {...props}
    />
  );
};

export { Skeleton };
