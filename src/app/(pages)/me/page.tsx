import { Plus } from "lucide-react";

import { ItemCard } from "@/components/item-card";
import { Button } from "@/components/ui/button";
import { H2, H3 } from "@/components/ui/topography";
import { Playlist } from "@/types";

const Page = () => {
  const playlists: Playlist[] = [];

  return (
    <>
      <div className="flex justify-between">
        <H2>Playlists</H2>

        {playlists.length > 0 && (
          <Button variant="secondary">
            <Plus className="mr-1 size-4" />
            Create
          </Button>
        )}
      </div>

      {playlists.length ?
        <>
          <div className="flex w-full flex-wrap justify-between gap-y-4">
            {playlists.map(({ id, name, url, follower_count, image }) => (
              <ItemCard
                key={id}
                name={name}
                url={url}
                subtitle={`${follower_count?.toLocaleString()} Fans`}
                type="playlist"
                image={image}
              />
            ))}
          </div>

          <H3 className="text-center">
            <em>Yay! You have seen it all</em> 🤩
          </H3>
        </>
      : <div className="flex h-[25rem] flex-col items-center justify-center space-y-4 rounded-md border border-dashed">
          <H3>You don&apos;t have any playlist yet 😢.</H3>

          <Button>
            <Plus className="mr-2 size-4" />
            Create Playlist
          </Button>
        </div>
      }
    </>
  );
};

export default Page;
