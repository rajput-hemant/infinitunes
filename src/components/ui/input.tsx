import React from "react";
import { IconType } from "react-icons";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: IconType;
  iconClass?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, iconClass, icon: Icon, ...props }, ref) => {
    return (
      <div
        className={cn(
          "flex w-full items-center transition-all duration-500",
          className
        )}
      >
        {Icon && (
          <Icon
            className={cn("text-label2 absolute ml-3 h-6 w-6", iconClass)}
          />
        )}

        <input
          className={cn(
            "border-border text-label2 placeholder:text-label2 flex h-10 w-full rounded-md border px-3 outline-none transition-all duration-500 placeholder:text-sm disabled:cursor-not-allowed disabled:opacity-50",
            className,
            Icon && "pl-11"
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);

export { Input };
