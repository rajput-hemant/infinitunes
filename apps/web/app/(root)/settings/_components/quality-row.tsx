import { Button } from "@infinitunes/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@infinitunes/ui/components/dropdown-menu";
import { ChevronDown } from "lucide-react";

import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

import { SettingsRow } from "./settings-row";

export type QualityOption<T extends string> = {
  value: T;
  detail?: string;
};

type QualityRowProps<T extends string> = {
  id: string;
  label: string;
  help: string;
  value: T;
  detail?: string;
  options: readonly QualityOption<T>[];
  onSelect: (value: T) => void;
};

export function QualityRow<T extends string>(props: QualityRowProps<T>) {
  const { id, label, help, value, detail, options, onSelect } = props;

  return (
    <SettingsRow id={id} label={label} help={help}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              aria-label={`${label}: ${value}`}
              className={cn(
                controlStyles.text,
                "group w-48 justify-between capitalize",
              )}
            >
              <span>
                {value}
                {detail && (
                  <span className="ml-2 text-xs font-light">({detail})</span>
                )}
              </span>
              <ChevronDown
                aria-hidden
                className="size-4 transition-transform group-data-[state=open]:rotate-180"
              />
            </Button>
          }
        />

        <DropdownMenuContent className="w-48 *:cursor-pointer *:capitalize">
          {options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onSelect(option.value)}
              className={cn(
                "justify-between",
                option.value === value && "bg-fill-2",
              )}
            >
              <span>{option.value}</span>
              {option.detail && (
                <span className="text-xs font-medium">{option.detail}</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SettingsRow>
  );
}
