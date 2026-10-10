import type { ReactNode } from "react";

export function CatalogGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] md:gap-x-4 xl:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] min-[1920px]:grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] min-[2560px]:grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] [&>*]:w-full!">
      {children}
    </div>
  );
}
