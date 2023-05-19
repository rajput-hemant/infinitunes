import { useState } from "react";
import { RxDownload, RxShare2 } from "react-icons/rx";
import { useLocation } from "react-router-dom";

import { Album, Playlist } from "@/types";
import { setPlaylist } from "@/store/player-slice";
import { siteConfig } from "@/config/site";
import { decodeHtml, downloadSong, getArtists } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/hooks";
import Card from "@/components/card";
import { Button } from "@/components/ui/button";
import {
  TopographyH2,
  TopographyH4,
  TopographySmall,
} from "@/components/ui/topography";
import ShareDialog from "./share-dialog";
import Dialog from "./ui/dialog";

const PlaylistHeader = ({ item }: { item: Album | Playlist }) => {
  const dispatch = useAppDispatch();
  const { downloadQuality } = useAppSelector((state) => state.root.preferences);
  const pathname = useLocation().pathname;

  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const shareDialogHeading =
    "username" in item ? "Share This Album" : "Share This Playlist";

  const downloadHandler = () => {
    item.songs.forEach((song) => downloadSong(song, downloadQuality));
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 text-center md:flex-row md:justify-start md:text-left">
      {/* image card */}
      <Card item={item} className="w-56 md:w-80" />

      {/* item info */}
      <div className="flex h-full w-full flex-col gap-2 md:gap-4">
        <TopographyH2>{decodeHtml(item.name)}</TopographyH2>

        {"artists" in item && (
          <>
            <TopographyH4 className="font-medium">
              by {decodeHtml(getArtists(item))}
            </TopographyH4>

            <TopographySmall>
              {item.songCount} Songs · {item.year}
            </TopographySmall>
          </>
        )}

        {"username" in item && (
          <TopographySmall>
            {(parseInt(item.followerCount) / 1000).toFixed(1)}K Followers ·{" "}
            {item.songCount} Songs
          </TopographySmall>
        )}

        {/* buttons */}
        <div className="flex items-center justify-center gap-2 md:justify-start">
          <Button
            onClick={() => dispatch(setPlaylist(item.songs))}
            className="w-fit gap-1 rounded-full px-9 text-lg font-bold"
          >
            Play
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={downloadHandler}
            className="rounded-full"
          >
            <RxDownload size={18} />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsShareDialogOpen(true)}
            className="rounded-full"
          >
            <RxShare2 size={18} />
          </Button>
        </div>
      </div>

      {/* share dialog */}
      <Dialog
        heading={shareDialogHeading}
        open={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
      >
        <ShareDialog url={`${siteConfig.url}${pathname}`} />
      </Dialog>
    </div>
  );
};

export default PlaylistHeader;
