import type { Favorite, MyPlaylist } from "@infinitunes/db/schema";
import type { Queue } from "@infinitunes/types";
import { Button, buttonVariants } from "@infinitunes/ui/components/button";
import { ListOrdered, Maximize2, MoreVertical } from "lucide-react";

import { TileMoreButton } from "~/components/song-list/more-button";
import type { User } from "~/lib/auth";
import { controlStyles } from "~/lib/control-styles";
import { cn } from "~/lib/utils";

import { BarButton } from "./bar-button";

type PlayerActionsProps = {
  /** The playing track; `undefined` when the queue is empty. */
  track: Queue | undefined;
  queueOpen: boolean;
  onToggleQueue: () => void;
  onExpand: () => void;
  user?: User;
  playlists?: MyPlaylist[];
  favorites?: Favorite | null;
};

/** Queue, expand and more actions at the end of the desktop bar. */
export function PlayerActions({
  track,
  queueOpen,
  onToggleQueue,
  onExpand,
  user,
  playlists,
  favorites,
}: PlayerActionsProps) {
  return (
    <>
      <BarButton
        tooltip="Queue"
        aria-label="Queue"
        aria-expanded={queueOpen}
        aria-controls="player-queue"
        onClick={onToggleQueue}
        className={cn(controlStyles.headerIcon, queueOpen && "text-primary")}
      >
        <ListOrdered aria-hidden className="size-5" />
      </BarButton>

      <BarButton
        tooltip="Expand player"
        aria-label="Expand player"
        onClick={onExpand}
        className={controlStyles.headerIcon}
      >
        <Maximize2 aria-hidden className="size-5" />
      </BarButton>

      {track ? (
        <TileMoreButton
          item={track}
          showAlbum
          user={user}
          playlists={playlists}
          favorites={favorites}
          className={buttonVariants({
            size: "icon",
            variant: "ghost",
            className: controlStyles.headerIcon,
          })}
        />
      ) : (
        <Button
          size="icon"
          variant="ghost"
          aria-label="More"
          className={controlStyles.headerIcon}
        >
          <MoreVertical aria-hidden className="size-5" />
        </Button>
      )}
    </>
  );
}
