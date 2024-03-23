import type { SliderCardProps } from "./slider-card";

import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { SliderCard } from "./slider-card";

type SliderListProps = {
  title: string;
  items: ({ id: string } & SliderCardProps)[];
};

export function SliderList({ title, items }: SliderListProps) {
  return (
    <>
      <h2 className="pl-2 font-heading text-xl drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-2xl md:text-3xl lg:pl-0">
        {title}
      </h2>

      <ScrollArea>
        <div className="flex space-x-4 pb-4">
          {items?.map(({ id, ...props }) => <SliderCard key={id} {...props} />)}
        </div>

        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </>
  );
}
