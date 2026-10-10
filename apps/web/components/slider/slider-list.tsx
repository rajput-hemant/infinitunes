import { Shelf } from "./shelf";
import { ShelfItem } from "./shelf-item";
import type { SliderCardProps } from "./slider-card";
import { SliderCard } from "./slider-card";

type SliderListItem = { id: string } & SliderCardProps;

type SliderListProps = {
  title: string;
  subtitle?: string;
  items: SliderListItem[];
};

export function SliderList({ title, subtitle, items }: SliderListProps) {
  return (
    <section className="space-y-3">
      <header>
        <h2 className="font-heading text-xl leading-7 font-bold tracking-[-0.015em] text-foreground">
          {title}
        </h2>

        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </header>

      <Shelf>
        {items.map(({ id, ...props }) => (
          <ShelfItem key={id}>
            <SliderCard {...props} />
          </ShelfItem>
        ))}
      </Shelf>
    </section>
  );
}
