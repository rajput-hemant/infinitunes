import { MdCopyright } from "react-icons/md";

import { siteConfig } from "@/config/site";
import SocialNav from "./social-nav";

const Footer = () => {
  return (
    <footer className="border-border text-label2 container flex flex-col items-center justify-center border-t py-1 pb-20 text-sm lg:pb-2">
      <SocialNav />

      <span>Released under the MIT License.</span>

      <span className="flex items-center gap-1">
        Copyright <MdCopyright /> 2022-{new Date().getFullYear()}
        <a
          href={siteConfig.links.github}
          className="hover:text-label px-1 underline underline-offset-2"
        >
          Khushal-ag@github
        </a>
      </span>
    </footer>
  );
};

export default Footer;
