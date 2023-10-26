import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { getTopShows } from "@/lib/jiosaavn-api";
import { cn } from "@/lib/utils";
import { ItemCard } from "@/components/item-card";
import { buttonVariants } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { H2, Muted } from "@/components/ui/topography";

export const dynamic = "force-dynamic"; // always fetch on page load

type Props = { searchParams: { page?: string } };

const PodcastsPage = async ({ searchParams: { page = "1" } }: Props) => {
  const {
    data: podcasts,
    last_page,
    trending_podcasts: { title, subtitle, data: trendingPodcasts },
  } = await getTopShows(page);

  return (
    <div className="space-y-4">
      <header>
        <H2 className="pb-0">{title}</H2>

        <Muted className="ml-1">{subtitle}</Muted>
      </header>

      <ScrollArea>
        <div className="grid grid-flow-col grid-rows-2 place-content-start gap-4 pb-6">
          {trendingPodcasts.map(
            ({ id, name, url, subtitle, type, image, explicit }) => {
              return (
                <ItemCard
                  key={id}
                  name={name}
                  url={url}
                  subtitle={subtitle}
                  type={type}
                  image={image}
                  explicit={explicit}
                />
              );
            }
          )}
        </div>

        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <H2>All Podcasts</H2>

      <div className="flex w-full flex-wrap justify-between gap-y-4">
        {podcasts.map(({ id, name, url, subtitle, type, image, explicit }) => (
          <ItemCard
            key={id}
            name={name}
            url={url}
            subtitle={subtitle}
            type={type}
            image={image}
            explicit={explicit}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-10">
        <Link
          href={`/show?page=${+page - (page === "1" ? 0 : 1)}`}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "group w-full font-bold",
            page === "1" && "bg-muted !text-muted-foreground cursor-not-allowed"
          )}
        >
          <ArrowLeft
            className={cn(
              "mr-2 h-4 w-4 duration-300",
              page !== "1" && "group-hover:-translate-x-2"
            )}
          />
          Prev
        </Link>

        <Link
          href={`/show?page=${+page + (last_page ? 0 : 1)}`}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "group w-full font-bold",
            last_page && "bg-muted !text-muted-foreground cursor-not-allowed"
          )}
        >
          Next
          <ArrowRight
            className={cn(
              "mr-2 h-4 w-4 duration-300",
              !last_page && "group-hover:translate-x-2"
            )}
          />{" "}
        </Link>
      </div>
    </div>
  );
};

export default PodcastsPage;
