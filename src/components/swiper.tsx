import { useRef } from "react";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - swiper types are not available
import SwiperCore, { Grid, Keyboard, Mousewheel, Pagination } from "swiper";
import { Swiper } from "swiper/react";

import { cn } from "@/lib/utils";
import { useWindowSize } from "@/hooks";
// swiper styles
import "swiper/swiper.css";
import "swiper/css/grid";
import "swiper/css/pagination";
import { TopographyH2 } from "./topography";

type CSwiperProps = {
  heading: string;
  children: React.ReactNode;
};

const CSwiper = ({ heading, children }: CSwiperProps) => {
  const swiperRef = useRef<SwiperCore>();
  const {
    windowDimension: { winWidth },
  } = useWindowSize();

  const prevSlide = () => {
    swiperRef.current?.slidePrev();
  };
  const nextSlide = () => {
    swiperRef.current?.slideNext();
  };

  const [slideCount, spaceBetween, slidesPerGroup] = (() => {
    if (winWidth <= 500) {
      return [2, 10, 1];
    }
    if (winWidth > 500 && winWidth <= 800) {
      return [3, 10, 2];
    }
    if (winWidth > 800 && winWidth <= 1100) {
      return [4, 15, 3];
    }
    if (winWidth > 1100 && winWidth <= 1440) {
      return [5, 20, 4];
    }
    if (winWidth > 1440 && winWidth <= 1790) {
      return [6, 30, 5];
    } else {
      return [6, 30, 5];
    }
  })();

  return (
    <div className="relative md:px-4 xl:px-14">
      <TopographyH2 inter className="pb-4 capitalize">
        {heading}
      </TopographyH2>

      <Swiper
        onBeforeInit={(swiper) => (swiperRef.current = swiper)}
        slidesPerView={slideCount}
        spaceBetween={spaceBetween}
        slidesPerGroup={slidesPerGroup}
        modules={[Pagination, Keyboard, Mousewheel, Grid]}
        mousewheel
        keyboard
        pagination={{ clickable: true }}
        grid={{ rows: 2, fill: "row" }}
        className="rounded-md"
      >
        {children}

        {/* pad pagination */}
        <div className="pt-6" />
      </Swiper>

      {/* swiper previous button */}
      <NavigationButton
        onClick={prevSlide}
        className="right-14 md:left-0 md:right-auto"
      >
        <FiArrowLeft />
      </NavigationButton>

      {/* swiper next button */}
      <NavigationButton onClick={nextSlide} className="right-0">
        <FiArrowRight />
      </NavigationButton>
    </div>
  );
};

export default CSwiper;

type NavigationButtonProps = {
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
};

const NavigationButton = ({
  onClick,
  className,
  children,
}: NavigationButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "hover:bg-accent absolute top-0 z-10 rounded-full bg-black/10 p-2.5 hover:text-white md:top-1/2 md:p-3",
        className
      )}
    >
      {children}
    </button>
  );
};
