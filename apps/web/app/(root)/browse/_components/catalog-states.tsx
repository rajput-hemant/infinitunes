import type { LucideIcon } from "lucide-react";

type CatalogEmptyProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function CatalogEmpty({
  icon: Icon,
  title,
  description,
}: CatalogEmptyProps) {
  return (
    <div className="grid justify-items-center gap-2 rounded-md border border-dashed border-border px-4 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-fill text-muted-foreground">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h2 className="text-base leading-6 font-bold">{title}</h2>
      <p className="max-w-88 text-sm leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

export function CatalogEnd() {
  return (
    <p className="py-6 text-center font-heading text-base leading-6 font-bold">
      <em>Yay! You have seen it all</em> <span>🤩</span>
    </p>
  );
}
