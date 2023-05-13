import { MdCopyright } from "react-icons/md";

import { siteConfig } from "@/config/site";
import SocialNav from "./social-nav";

const Footer = () => {
  return (
    <footer className="border-border text-muted container flex flex-col items-center justify-center  border-t py-1 pb-2 text-sm">
      <SocialNav />

      <span>Released under the MIT License.</span>

      <span className="flex items-center gap-1">
        Copyright <MdCopyright /> 2022-{new Date().getFullYear()}
        <a
          href={siteConfig.links.github}
          className="px-1 underline underline-offset-2"
        >
          rajput-hemant@github
        </a>
      </span>
    </footer>
  );
};

export default Footer;
