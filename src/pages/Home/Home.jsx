import { Autoplay, Navigation, Pagination } from "swiper";
import { useEffect, useState } from "react";
// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/autoplay";

import { Box, StyledSlider, StyledSwiper } from "./Home.style";
import api from "../../api/JioSaavnApi";

const Home = () => {
	const [playlists, setPlaylists] = useState([]);
	const [trending, setTtrending] = useState([]);
	const [albums, setAlbums] = useState([]);
	const [charts, setCharts] = useState([]);

	useEffect(() => {
		const fetchData = async () => {
			const _playlists = await api.getPlaylists(),
				_trending = await api.getTrending(),
				_albums = await api.getEditorialPicks(),
				_charts = await api.getCharts();

			setPlaylists(_playlists);
			setTtrending(_trending);
			setAlbums(_albums);
			setCharts(_charts);
		};

		try {
			fetchData();
		} catch (error) {
			console.log("Unable to fetch Home Data: ", error);
		}
	}, []);

	return (
		<Box>
			<StyledSwiper
				slidesPerView={6}
				spaceBetween={300}
				autoplay={{
					delay: 2000,
					// disableOnInteraction: false,
				}}
				loop={true}
				pagination={{
					clickable: true,
				}}
				mousewheel={true}
				navigation={true}
				modules={[Autoplay, Pagination, Navigation]}
			>
				{playlists.map((item) => (
					<StyledSlider>
						<img src={item.image} alt="" />
					</StyledSlider>
				))}
			</StyledSwiper>
		</Box>
	);
};

export default Home;
