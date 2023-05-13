import { useEffect, useState } from "react";

import { useEventListener } from ".";

const useWindowSize = () => {
  const [windowDimension, setWindowDimension] = useState({
    winWidth: window.innerWidth,
    winHeight: window.innerHeight,
  });

  const handleResize = () => {
    setWindowDimension({
      winWidth: window.innerWidth,
      winHeight: window.innerHeight,
    });
  };

  useEventListener("resize", handleResize);

  useEffect(() => {
    handleResize();
  }, []);

  const isMobile = windowDimension.winWidth <= 767;

  const isTablet =
    windowDimension.winWidth > 767 && windowDimension.winWidth <= 1024;

  const isDesktop =
    windowDimension.winWidth > 1024 && windowDimension.winWidth <= 1440;

  const isLargeDesktop = windowDimension.winWidth > 1440;

  return {
    windowDimension,
    /** greater than 767px */
    isMobile,
    /** greater than 767px and less than 1024px */
    isTablet,
    /** greater than 1024px and less than 1440px */
    isDesktop,
    /** greater than 1440px */
    isLargeDesktop,
  };
};

export default useWindowSize;
