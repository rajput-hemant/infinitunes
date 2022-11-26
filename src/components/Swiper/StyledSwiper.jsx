import { Autoplay, Navigation } from "swiper";
import { FaPlay } from "react-icons/fa";

// Import Swiper styles
import "swiper/css";
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

	const cartSubtitle = (item) => {
		if (item.type === "album" && item.more_info.artistMap !== undefined) {
			let artists = "";
			item.more_info.artistMap.artists.map(
				(artist) => (artists += `${artist.name}, `)
			);
			return <h5>{artists.slice(0, -2)}</h5>;
		}
		if (item.type === "playlist" && item.more_info.firstname !== undefined)
			return <h5>{item.more_info.firstname}</h5>;
		if (item.type === "playlist" && item.more_info.subtitle !== undefined)
			return <h5>{item.more_info.subtitle}</h5>;
		if (item.type === "album" && item.more_info.subtitle !== undefined)
			return <h5>{item.more_info.release_year}</h5>;
		if (item.data_type === "featured" && item.follower_count !== undefined)
			return <h5>{item.follower_count}</h5>;
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
			centeredSlides={true}
			navigation={true}
			longSwipes={true}
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
						<button onClick={() => console.log(item.title)}>
							<FaPlay size={50} color="red" />
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
