import React from "react";
import { VariantProps, cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex w-fit items-center justify-center rounded-md text-sm font-semibold transition-colors duration-300 focus-visible:outline-none active:scale-[102%] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary hover:bg-secondary text-white",
        destructive:
          "bg-destructive/20 hover:bg-destructive/30 text-destructive",
        outline: "border-border border hover:bg-white hover:text-black",
        ghost:
          "hover:bg-accent hover:text-label hover:border-border border border-transparent",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };
