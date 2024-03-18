import MobileSearch from "@/components/search/mobile-search";
import { TopSearch } from "@/components/search/top-search";

const Page = () => {
  return (
    <div className="size-full min-h-[calc(100vh-13.5rem)] space-y-2">
      <MobileSearch topSearch={<TopSearch />} />
    </div>
  );
};

export default Page;
