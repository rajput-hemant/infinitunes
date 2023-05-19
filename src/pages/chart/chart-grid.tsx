import { useEffect } from "react";
import useSwr from "swr";

import { getHomeData } from "@/lib/utils";
import Card from "@/components/card";
import Loading from "@/components/loading";
import Center from "@/components/ui/center";
import { TopographyH2 } from "@/components/ui/topography";

const ChartGrid = () => {
  const { data } = useSwr("/home", getHomeData);

  useEffect(() => {
    document.title = "Top Charts | Infinitunes";
  }, []);

  return (
    <div>
      <TopographyH2 className="pb-4">Top Charts</TopographyH2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {data ? (
          data.charts.map((chart) => (
            <Card isLink key={chart.id} item={chart} />
          ))
        ) : (
          <Center absolutely>
            <Loading iconSize={50} />
          </Center>
        )}
      </div>
    </div>
  );
};

export default ChartGrid;
