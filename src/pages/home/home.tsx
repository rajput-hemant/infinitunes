import { SwiperSlide } from "swiper/react";
import useSwr from "swr";

import Card from "@/components/card";
import Loading from "@/components/loading";
import CSwiper from "@/components/swiper";
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
                <Card item={item} />
              </SwiperSlide>
            ))}
          </CSwiper>
        ))
      ) : (
        <div className="absolute left-1/2 top-1/2">
          <Loading iconSize={50} />
        </div>
      )}
    </>
  );
};

export default Home;
