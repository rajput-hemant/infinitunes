import { useNavigate } from "react-router-dom";
import { Autoplay, Navigation } from "swiper";
import { FaPlay } from "react-icons/fa";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/autoplay";

import useWindowResize from "../../hooks/useWindowResize";
import { StyledSlider, SwiperComponent } from "./StyledSwiper.style";
import { cartSubtitle, itemCount } from "./SwiperFns";

const StyledSwiper = ({ source, isBanner = false }) => {
	const navigate = useNavigate();
	const { winWidth } = useWindowResize();

	const redirect = (item) => {
		const id = item.id,
			type = item.type,
			title = item.title
				.toLowerCase()
				.replace(/[^\w\s]/gi, "")
				.replaceAll(" ", "+");

		if (item.type === "album") {
			navigate(`/album/${id}/${title}`, { state: { id, type } });
		}

		if (item.type === "playlist")
			navigate(`/featured/${id}/${title}`, { state: { id, type } });
	};

	return (
		<SwiperComponent
			isbanner={isBanner}
			slidesPerView={itemCount(winWidth)}
			spaceBetween={isBanner ? 300 : 200}
			autoplay={{
				delay: isBanner ? 2000 : 4000,
				disableOnInteraction: false,
			}}
			pagination={{
				clickable: true,
			}}
			// mousewheel={true}
			centeredSlides={true}
			navigation={true}
			loop={true}
			modules={[Autoplay, Navigation]}
		>
			{source.map((item, index) => (
				<StyledSlider key={index} isbanner={isBanner}>
					<div>
						<img
							src={item.image.replace("150x150", "500x500")}
							alt={item.title}
						/>
						<button onClick={() => redirect(item)}>
							<FaPlay size={50} color="#74f2ce" />
						</button>
						{!isBanner && (
							<>
								<h4>{item.title !== undefined ? item.title : item.listname}</h4>
								{cartSubtitle(item)}
							</>
						)}
					</div>
				</StyledSlider>
			))}
		</SwiperComponent>
	);
};

export default StyledSwiper;
