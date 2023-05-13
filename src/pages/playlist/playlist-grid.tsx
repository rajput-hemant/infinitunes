import useSwr from "swr";

import Card from "@/components/card";
import Loading from "@/components/loading";
import { TopographyH2 } from "@/components/topography";
import { getHomeData } from "../home/get-home-data";

const PlaylistGrid = () => {
  const { data } = useSwr("/home", getHomeData);

  return (
    <div>
      <TopographyH2 className="pb-4">Top Playlists</TopographyH2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {data ? (
          data.playlists.map((playlist) => (
            <Card key={playlist.id} item={playlist} />
          ))
        ) : (
          <div className="absolute left-1/2 top-1/2">
            <Loading iconSize={50} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistGrid;
