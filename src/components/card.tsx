import { FaPlay } from "react-icons/fa";
import { Link } from "react-router-dom";

import {
  Album,
  Chart,
  Image,
  ImageQuality,
  PlaylistV2,
  TrendingV2,
} from "@/types";
import { clearUrl, strToBase64 } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";

type CardProps = {
  item: TrendingV2 | Album | PlaylistV2 | Chart;
};

const Card = ({ item }: CardProps) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const { type, id, name, title } = item;

  const getImage = (image: Image, quality?: ImageQuality) => {
    if (typeof image == "boolean") return "/images/logo512.png";

    if (quality === "large") {
      return image[2].link;
    } else if (quality === "medium") {
      return image[1].link;
    } else if (quality === "small") {
      return image[0].link;
    }

    return image[2].link;
  };

  const getHref = () => {
    const url = clearUrl(name ?? title);
    const base64Id = strToBase64(id);

    if (type === "song") {
      return `/song/${url}/${base64Id}`;
    } else if (type === "album") {
      return `/album/${url}/${base64Id}`;
    } else {
      return `/playlist/${url}/${base64Id}`;
    }
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
    } else {
      return item.subtitle;
    }
  };

  return (
    <Link to={getHref()} className="group">
      <div className="hover:shadow-accent relative aspect-square overflow-hidden rounded-md shadow-lg">
        {/* image */}
        <img
          src={getImage(item.image)}
          alt={item.id}
          className="h-full w-full rounded-md object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* skeleton */}
        <Skeleton className="absolute inset-0 h-full w-full" />

        {/* play button */}
        <div className="invisible absolute inset-[6rem] z-20 flex items-center justify-center rounded-full bg-black/50 transition-all duration-200 hover:inset-[5.5rem] hover:bg-black/75 group-hover:visible">
          <FaPlay size={30} className="ml-1.5 text-white" />
        </div>

        {/* overlay */}
        <div className="invisible absolute inset-0 z-10 rounded-md bg-black/50 group-hover:visible" />
      </div>

      <div className="flex flex-col py-2">
        {/* title */}
        <p className="font-inter truncate text-center text-sm font-medium text-black/75 hover:text-black">
          {name ?? title}
        </p>

        {/* subtitle */}
        <p className="truncate text-center text-sm text-gray-700">
          {getSubtitle()}
        </p>
      </div>
    </Link>
  );
};

export default Card;
