import {
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@infinitunes/ui/components/dropdown-menu";
import { Share2 } from "lucide-react";

import { ShareOptions } from "./share-options";

export function ShareSubMenu({
  title,
  path,
}: {
  title?: string;
  path?: string;
}) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Share2 className="mr-3 size-4" />
        Share
      </DropdownMenuSubTrigger>

      <DropdownMenuPortal>
        <DropdownMenuSubContent className="w-auto min-w-48">
          <ShareOptions isDropDownItem title={title} path={path} />
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
