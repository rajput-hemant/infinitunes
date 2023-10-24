import { getLabelDetails } from "@/lib/jiosaavn-api";
import DetailsHeader from "@/components/details-header";
import { ItemCard } from "@/components/item-card";
import SongList from "@/components/song-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Props = { params: { slug: [string, string] } };

const TABS = { Songs: "Songs", Albums: "Albums" };

const Page = async ({ params: { slug } }: Props) => {
  const label = await getLabelDetails(slug[1]);

  return (
    <>
      <DetailsHeader item={label} />

      <Tabs defaultValue={TABS.Songs}>
        <TabsList>
          {Object.entries(TABS).map(([key, value]) => (
            <TabsTrigger key={key} value={value}>
              {value}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={TABS.Songs}>
          <SongList songs={label.top_songs.songs} />
        </TabsContent>

        <TabsContent value={TABS.Albums}>
          <div className="flex w-full flex-wrap justify-between gap-y-4">
            {label.top_albums.albums.map(
              ({ id, name, url, subtitle, type, image }) => (
                <ItemCard
                  key={id}
                  name={name}
                  url={url}
                  subtitle={subtitle}
                  type={type}
                  image={image}
                />
              )
            )}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default Page;
