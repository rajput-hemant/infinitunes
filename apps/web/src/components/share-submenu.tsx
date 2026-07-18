import {
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@infinitunes/ui/dropdown-menu";
import { Share2 } from "lucide-react";

import { ShareOptions } from "./share-options";

export function ShareSubMenu() {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Share2 className="mr-2 size-4" />
        Share
      </DropdownMenuSubTrigger>

      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <ShareOptions isDropDownItem />
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
