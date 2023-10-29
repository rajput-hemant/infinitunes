import { FaPlay } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";

import { Album, Chart, Playlist, PlaylistT, TrendingT } from "@/types";
import { getSongAsync, setPlaylist } from "@/store/player-slice";
import { clearUrl, cn, decodeHtml, getImage, strToBase64 } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { Skeleton } from "./ui/skeleton";

type CardProps = {
  isLink?: boolean;
  className?: string;
  item: TrendingT | Album | Playlist | PlaylistT | Chart;
};

const Card = ({ isLink, className, item }: CardProps) => {
  const { pathname } = useLocation();
  const dispatch = useAppDispatch();

  const { imageQuality } = useAppSelector((state) => state.root.preferences);

  // @ts-ignore
  const { type, id, name, title } = item;

  const getHref = () => {
    const url = clearUrl(name ?? title);
    const base64Id = strToBase64(id);

    if (type === "album") {
      return `/album/${url}/${base64Id}`;
    } else if (pathname.split("/")[1] === "chart") {
      return `/chart/${url}/${base64Id}`;
    } else if (type === "playlist") {
      return `/playlist/${url}/${base64Id}`;
    } else return "#";
  };

  const getSubtitle = () => {
    if (type === "album") {
      return typeof item.artists === "string"
        ? item.artists
        : item.artists.map((artist) => artist.name).join(", ");
    } else if (type === "song") {
      return typeof item.primaryArtists === "string"
        ? item.primaryArtists
        : item.primaryArtists.map((artist) => artist.name).join(", ");
    } else if (type === "PlaylistT") {
      return item.subtitle;
    }
  };

  const clickHandler = () => {
    if (type === "song") {
      dispatch(getSongAsync(item.id));
    } else if (!isLink) {
      // @ts-ignore
      dispatch(setPlaylist(item.songs));
    }
  };

  const Wrapper = isLink && type !== "song" ? Link : "div";

  return (
    // do not apply styles to wrapper itself
    <Wrapper to={getHref()} onClick={clickHandler}>
      <div
        className={cn(
          "border-border hover:bg-muted group cursor-pointer rounded-md border",
          className
        )}
      >
        <div className="hover:shadow-primary relative m-1 aspect-square overflow-hidden rounded-md">
          {/* image */}
          <img
            src={getImage(item.image, imageQuality)}
            alt={item.id}
            className="h-full w-full rounded-md object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* skeleton */}
          <Skeleton className="absolute inset-0 -z-10 h-full w-full" />

          {/* play button */}
          <div className="invisible absolute inset-0 z-20 grid place-items-center group-hover:visible">
            <div className="grid aspect-square w-16 place-items-center rounded-full bg-black/50 transition-all duration-200 hover:w-20 hover:bg-black/75">
              <FaPlay size={30} className="ml-1.5 text-white" />
            </div>
          </div>

          {/* overlay */}
          <div className="invisible absolute inset-0 z-10 rounded-md bg-black/50 group-hover:visible" />
        </div>

        {isLink && (
          <div className="flex flex-col p-2">
            {/* title */}
            <p className="text-label truncate text-center text-sm font-semibold group-hover:text-black dark:group-hover:text-white">
              {decodeHtml(name ?? title)}
            </p>

            {/* subtitle */}
            <p className="text-label truncate text-center text-sm">
              {getSubtitle()}
            </p>
          </div>
        )}
      </div>
    </Wrapper>
  );
};

export default Card;