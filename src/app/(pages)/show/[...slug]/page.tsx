import { Sort } from "@/types";
import { getShowDetails } from "@/lib/jiosaavn-api";
import DetailsHeader from "@/components/details-header";
import { ItemCard } from "@/components/item-card";
import SongList from "@/components/song-list";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Blockquote, H3 } from "@/components/ui/topography";

type Props = {
  searchParams: { sort: Sort };
  params: { slug: [string, number, string] };
};

const ShowDetailsPage = async ({
  params: { slug },
  searchParams: { sort = "asc" },
}: Props) => {
  const [_, season, token] = slug;
  const { episodes, modules, seasons, show_details } = await getShowDetails(
    token,
    season,
    sort
  );

  return (
    <>
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

      {/* song list */}
      <H3>{modules.episodes.title}</H3>
      <SongList songs={episodes} />

      {/* about */}
      <H3>{modules.show_details.title}</H3>
      <Blockquote className="max-w-4xl leading-snug text-muted-foreground">
        {show_details.description}
      </Blockquote>
    </>
  );
};

export default ShowDetailsPage;
