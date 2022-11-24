import React from "react";
import { Autoplay, Navigation, Pagination } from "swiper";
// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/autoplay";

import { StyledSlider, SwiperComponent } from "./StyledSwiper.style";

const StyledSwiper = ({ source, slides, padding, delay, isBanner = false }) => {
	return (
		<SwiperComponent
			slidesPerView={slides}
			spaceBetween={padding}
			isbanner={isBanner}
			autoplay={{
				// delay: 2000,
				delay: delay,
				disableOnInteraction: false,
			}}
			pagination={{
				clickable: true,
			}}
			// mousewheel={true}
			navigation={true}
			modules={[Autoplay, Pagination, Navigation]}
		>
			{source.map((item) => (
				<StyledSlider isbanner={isBanner}>
					<img src={item.image.replace("150x150", "500x500")} alt="" />
					{/* {children} */}
				</StyledSlider>
			))}
		</SwiperComponent>
	);
};

export default StyledSwiper;
