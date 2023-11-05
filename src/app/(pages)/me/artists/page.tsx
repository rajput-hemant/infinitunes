import { Construction } from "lucide-react";

import { H2 } from "@/components/ui/topography";

const Page = () => {
  return (
    <div className="grid place-items-center space-y-4">
      <Construction size={50} className="mr-2" />

      <H2 className="text-center">
        Under development. <br /> Please check back later.
      </H2>
    </div>
  );
};

export default Page;
