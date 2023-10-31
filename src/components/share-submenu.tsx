import { Facebook, Link, Share2, Twitter } from "lucide-react";

import {
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "./ui/dropdown-menu";

const ShareSubMenu = () => {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Share2 className="mr-2 h-4 w-4" />
        <span>Share</span>
      </DropdownMenuSubTrigger>

      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <DropdownMenuItem>
            <Link className="mr-2 h-4 w-4" />
            <span>Copy Link</span>
          </DropdownMenuItem>

          <DropdownMenuItem>
            <Link className="mr-2 h-4 w-4" />
            <span>WhatsApp</span>
          </DropdownMenuItem>

          <DropdownMenuItem>
            <Twitter className="mr-2 h-4 w-4" />
            <span>Twitter</span>
          </DropdownMenuItem>

          <DropdownMenuItem>
            <Facebook className="mr-2 h-4 w-4" />
            <span>Facebook</span>
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
};

export default ShareSubMenu;
