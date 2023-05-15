import { SwiperSlide } from "swiper/react";
import useSwr from "swr";

import Card from "@/components/card";
import Loading from "@/components/loading";
import CSwiper from "@/components/swiper";
import Center from "@/components/ui/center";
import { getHomeData } from "./get-home-data";

const Home = () => {
  const { data } = useSwr("/home", getHomeData);

  return (
    <>
      {data ? (
        Object.entries(data).map(([key, value]) => (
          <CSwiper key={key} heading={key}>
            {value.map((item, i) => (
              <SwiperSlide key={i}>
                <Card isLink item={item} />
              </SwiperSlide>
            ))}
          </CSwiper>
        ))
      ) : (
        <Center absolutely>
          <Loading iconSize={50} />
        </Center>
      )}
    </>
  );
};

export default Home;
