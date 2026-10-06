import {
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@infinitunes/ui/components/dropdown-menu";
import { Share2 } from "lucide-react";

import { ShareOptions } from "./share-options";

export function ShareSubMenu({ title }: { title?: string }) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Share2 className="mr-2 size-4" />
        Share
      </DropdownMenuSubTrigger>

      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <ShareOptions isDropDownItem title={title} />
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
