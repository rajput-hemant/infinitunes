import {
  Disc,
  ListMusic,
  ListOrdered,
  MoreVertical,
  Radio,
} from "lucide-react";

import ShareSubMenu from "./share-submenu";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Separator } from "./ui/separator";

const DetailsHeaderDropdown = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="outline" className="rounded-full">
          <MoreVertical className="h-6 w-6" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Disc className="mr-2 h-4 w-4" />
            <span>Play Playlist Now</span>
          </DropdownMenuItem>

          <DropdownMenuItem>
            <Radio className="mr-2 h-4 w-4" />

            <span>Playlist Radio</span>
          </DropdownMenuItem>

          <DropdownMenuItem>
            <ListOrdered className="mr-2 h-4 w-4" />
            <span>Add to Queue</span>
          </DropdownMenuItem>

          <DropdownMenuItem>
            <ListMusic className="mr-2 h-4 w-4" />
            <span>Add To Playlist</span>
          </DropdownMenuItem>

          <Separator className="my-2" />

          <ShareSubMenu />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DetailsHeaderDropdown;
