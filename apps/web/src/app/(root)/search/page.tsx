import { TopSearch } from "@/components/search/top-search";
import { MobileSearch } from "./_components/mobile-search";

export default function SearchPage() {
  return (
    <div className="size-full min-h-[calc(100vh-13.5rem)] space-y-4">
      <MobileSearch topSearch={<TopSearch />} />
    </div>
  );
}
