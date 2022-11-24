import React from "react";
import { Autoplay, Navigation, Pagination } from "swiper";
// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/autoplay";

import useWindowResize from "../../hooks/useWindowResize";
import { StyledSlider, SwiperComponent } from "./StyledSwiper.style";

const StyledSwiper = ({ source, isBanner = false }) => {
	const windowDimension = useWindowResize();
	const { winWidth } = windowDimension;

	const itemCount = () => {
		if (winWidth <= 500) {
			return [3];
		}
		if (winWidth > 500 && winWidth <= 800) {
			return [4];
		}
		if (winWidth > 800 && winWidth <= 1440) {
			return [5];
		}
		if (winWidth > 1440 && winWidth <= 1790) {
			return [6];
		}
		if (winWidth > 1790) {
			return [7];
		}
	};

	const spaceBetween = () => {
		if (winWidth <= 500) {
			return [10];
		}
		if (winWidth > 500 && winWidth <= 800) {
			return [10];
		}
		if (winWidth > 800 && winWidth <= 1100) {
			return [15];
		}
		if (winWidth > 1100 && winWidth <= 1440) {
			return [0];
		}
		if (winWidth > 1440) {
			return [0];
		}
	};

	return (
		<SwiperComponent
			isbanner={isBanner}
			slidesPerView={6}
			spaceBetween={isBanner ? 300 : 200}
			autoplay={{
				delay: isBanner ? 2000 : 4000,
				disableOnInteraction: false,
			}}
			pagination={{
				clickable: true,
			}}
			// mousewheel={true}
			navigation={true}
			longSwipes={true}
			loop={true}
			modules={[Autoplay, Pagination, Navigation]}
		>
			{source.map((item, index) => (
				<StyledSlider key={index} isbanner={isBanner}>
					<img
						src={item.image.replace("150x150", "500x500")}
						alt={item.title}
					/>
					{/* {console.log(item)} */}
				</StyledSlider>
			))}
		</SwiperComponent>
	);
};

export default StyledSwiper;
