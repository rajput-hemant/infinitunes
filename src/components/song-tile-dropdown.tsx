"use client";

import {
  Disc,
  Disc3,
  ListMusic,
  ListOrdered,
  MoreVertical,
  Play,
  Radio,
  User2,
} from "lucide-react";

import ShareSubMenu from "./share-submenu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Separator } from "./ui/separator";

const SongTileDropDown = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <MoreVertical className="hover:text-primary h-6 w-6" />
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Play className="mr-2 h-4 w-4" />
            <span>Play Song Now</span>
          </DropdownMenuItem>

          <DropdownMenuItem>
            <ListOrdered className="mr-2 h-4 w-4" />
            <span>Add to Queue</span>
          </DropdownMenuItem>

          <DropdownMenuItem>
            <ListMusic className="mr-2 h-4 w-4" />
            <span>Add To Playlist</span>
          </DropdownMenuItem>

          <DropdownMenuItem>
            <Radio className="mr-2 h-4 w-4" />
            <span>Play Radio</span>
          </DropdownMenuItem>

          <ShareSubMenu />

          <Separator className="my-2" />

          <DropdownMenuItem>
            <Disc3 className="mr-2 h-4 w-4" />
            <span>Song Details & Lyrics</span>
          </DropdownMenuItem>

          <DropdownMenuItem>
            <Disc className="mr-2 h-4 w-4" />
            <span>More From Album</span>
          </DropdownMenuItem>

          <DropdownMenuItem>
            <User2 className="mr-2 h-4 w-4" />
            <span>More From Artist</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SongTileDropDown;
