import { cn } from "@/lib/utils";

interface TopographyProps {
  className?: string;
  children: React.ReactNode;
}

export const TopographyH1 = ({ className, children }: TopographyProps) => {
  return (
    <h1
      className={cn(
        "scroll-m-20 text-3xl font-extrabold md:text-4xl lg:text-5xl",
        className
      )}
    >
      {children}
    </h1>
  );
};

export const TopographyH2 = ({ className, children }: TopographyProps) => {
  return (
    <h2
      className={cn(
        "scroll-m-20 text-2xl font-semibold md:text-3xl lg:text-4xl",
        className
      )}
    >
      {children}
    </h2>
  );
};

export const TopographyH3 = ({ className, children }: TopographyProps) => {
  return (
    <h3
      className={cn(
        "scroll-m-20 text-xl font-medium md:text-2xl lg:text-3xl",
        className
      )}
    >
      {children}
    </h3>
  );
};

export const TopographyH4 = ({ className, children }: TopographyProps) => {
  return (
    <h4 className={cn("scroll-m-20 text-xl font-light md:text-2xl", className)}>
      {children}
    </h4>
  );
};

export const TopographyP = ({ className, children }: TopographyProps) => {
  return (
    <p className={cn("leading-7 [&:not(:first-child)]:mt-2", className)}>
      {children}
    </p>
  );
};

export const TopographyLarge = ({ className, children }: TopographyProps) => {
  return (
    <div className={cn("text-lg font-semibold", className)}>{children}</div>
  );
};

export const TopographySmall = ({ className, children }: TopographyProps) => {
  return (
    <small
      className={cn(
        "text-sm leading-none md:text-base md:leading-5 lg:leading-6",
        className
      )}
    >
      {children}
    </small>
  );
};

export const TopographySubtle = ({ className, children }: TopographyProps) => {
  return <p className={cn("text-label2 text-sm", className)}>{children}</p>;
};
