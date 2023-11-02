import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { Sort } from "@/types";
import { getShowDetails } from "@/lib/jiosaavn-api";
import { DetailsHeader } from "@/components/details-header";
import { ItemCard } from "@/components/item-card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Blockquote, H3 } from "@/components/ui/topography";
import { EpisodeList } from "./episode-list";

type Props = {
  searchParams: { sort: Sort };
  params: { slug: [string, number, string] };
};

const ShowDetailsPage = async ({
  params: { slug },
  searchParams: { sort = "desc" },
}: Props) => {
  const [_, season, token] = slug;
  const { episodes, modules, seasons, show_details } = await getShowDetails(
    token,
    season,
    sort
  );

  return (
    <div className="mb-4 space-y-4">
      {/* playlist details header */}
      <DetailsHeader item={show_details} />

      {/* seasons */}
      <H3>{modules.seasons.title}</H3>

      <ScrollArea>
        <div className="flex space-x-4 pb-4">
          {seasons.reverse().map(({ id, name, url, subtitle, image }) => (
            <ItemCard
              key={id}
              name={name}
              url={url}
              subtitle={subtitle}
              type="show"
              image={image}
              aspect="video"
            />
          ))}
        </div>

        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* eoisode list & sonrt order */}
      <div className="flex justify-between">
        <H3>{modules.episodes.title}</H3>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-36">
              {sort === "asc" ? "Oldest" : "Newest"}
              <ChevronDown className="ml-auto h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-36">
            <DropdownMenuItem asChild>
              <Link href="?sort=desc" className="cursor-pointer">
                Newest
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href="?sort=asc" className="cursor-pointer">
                Oldest
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <EpisodeList
        showId={show_details.id}
        season={show_details.season_number}
        sort={sort}
        totalEpisodes={show_details.total_episodes}
        initialEpisodes={episodes}
      />

      {/* about */}
      <H3>{modules.show_details.title}</H3>
      <Blockquote className="text-muted-foreground max-w-4xl leading-snug">
        {show_details.description}
      </Blockquote>
    </div>
  );
};

export default ShowDetailsPage;
