import { FaPlay } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";

import { Album, Chart, Playlist, PlaylistV2, TrendingV2 } from "@/types";
import { clearUrl, cn, decodeHtml, getImage, strToBase64 } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";

type CardProps = {
  isLink?: boolean;
  className?: string;
  item: TrendingV2 | Album | Playlist | PlaylistV2 | Chart;
};

const Card = ({ isLink, className, item }: CardProps) => {
  const { pathname } = useLocation();

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const { type, id, name, title } = item;

  const getHref = () => {
    const url = clearUrl(name ?? title);
    const base64Id = strToBase64(id);

    if (type === "song") {
      return `/song/${url}/${base64Id}`;
    } else if (type === "album") {
      return `/album/${url}/${base64Id}`;
    } else if (pathname.split("/")[1] === "chart") {
      return `/chart/${url}/${base64Id}`;
    } else {
      return `/playlist/${url}/${base64Id}`;
    }
  };

  const getSubtitle = () => {
    // to exclude Playlist type
    if ("type" in item) {
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
    }
  };

  return (
    <Wrapper
      href={getHref()}
      isLink={isLink}
      className={cn("group", className)}
    >
      <div className="hover:shadow-primary relative aspect-square overflow-hidden rounded-md shadow-lg">
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

      {isLink && (
        <div className="flex flex-col py-2">
          {/* title */}
          <p className="font-inter text-label truncate text-center text-sm font-semibold hover:text-black">
            {decodeHtml(name ?? title)}
          </p>

          {/* subtitle */}
          <p className="text-label truncate text-center text-sm">
            {getSubtitle()}
          </p>
        </div>
      )}
    </Wrapper>
  );
};

type WrapperProps = {
  isLink?: boolean;
  href: string;
  className: string;
  children: React.ReactNode;
};

const Wrapper = ({ isLink, href, children, className }: WrapperProps) => {
  return isLink ? (
    <Link to={href} className={className}>
      {children}
    </Link>
  ) : (
    <div className={className}>{children}</div>
  );
};

export default Card;
