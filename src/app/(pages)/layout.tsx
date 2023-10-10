"use client";

import { useSelectedLayoutSegments } from "next/navigation";

import SecondaryNavbar from "@/components/sec-nav";
import { Separator } from "@/components/ui/separator";

type Props = {
  children: React.ReactNode;
};

const RoutesLayout = ({ children }: Props) => {
  const segment = useSelectedLayoutSegments();

  return (
    <div className="space-y-4 p-4 lg:px-8">
      {segment.length === 1 && (
        <>
          <SecondaryNavbar />

          <Separator />
        </>
      )}

      {children}
    </div>
  );
};

export default RoutesLayout;
