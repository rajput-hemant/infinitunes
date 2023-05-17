import { AlbumSearch, PlaylistSearch, SongSearch } from "@/types";
import SongTile from "@/components/song-tile";

type SearchListProps = {
  item: SongSearch | AlbumSearch | PlaylistSearch;
};

const SearchList = ({ item }: SearchListProps) => {
  return (
    <div className="space-y-2">
      {item?.results.map((item) => (
        <SongTile key={item.id} item={item} />
      ))}
    </div>
  );
};

export default SearchList;
