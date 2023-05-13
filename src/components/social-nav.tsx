import { BsDiscord, BsGithub, BsTwitter } from "react-icons/bs";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./ui/button";

type SocialNavProps = {
  className?: string;
};

const SocialNav = ({ className }: SocialNavProps) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <a
        href={siteConfig.links.github}
        target="_blank"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "h-full w-full p-2"
        )}
      >
        <BsGithub className="h-5 w-5" />
      </a>

      <a
        href={siteConfig.links.twitter}
        target="_blank"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "h-full w-full p-2"
        )}
      >
        <BsTwitter className="h-5 w-5" />
      </a>

      <a
        href={siteConfig.links.twitter}
        target="_blank"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "h-full w-full p-2"
        )}
      >
        <BsDiscord className="h-5 w-5" />
      </a>
    </div>
  );
};

export default SocialNav;
