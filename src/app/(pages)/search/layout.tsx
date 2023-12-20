"use client";

import { notFound, usePathname } from "next/navigation";

import { useWindowSize } from "@/hooks/use-window-size";

type Props = {
  children: React.ReactNode;
};

const SearchLayout = ({ children }: Props) => {
  const pathname = usePathname();
  const { width } = useWindowSize();

  if (pathname === "/search" && width > 1024) {
    return notFound();
  }

  return children;
};

export default SearchLayout;
