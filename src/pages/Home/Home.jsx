import { useEffect, useState } from "react";

import { Box } from "./Home.style";
import api from "../../api/JioSaavnApi";
import StyledSwiper from "../../components/Swiper/StyledSwiper";

const Home = () => {
	const [playlists, setPlaylists] = useState([]),
		[trending, setTrending] = useState([]),
		[newRelease, setNewRelease] = useState([]),
		[albums, setAlbums] = useState([]),
		[charts, setCharts] = useState([]),
		[podcasts, setPodcasts] = useState([]),
		[devotional, setDevotional] = useState([]),
		[topGenreAndMood, setTopGenreAndMood] = useState([]),
		[bestofSocietyAndCulture, setBestofSocietyAndCulture] = useState([]),
		[newReleasePop, setNewReleasePop] = useState([]),
		[topAlbums, setTopAlbums] = useState([]);

	const homeData = [
		{ label: "Trending Now", array: trending },
		{ label: "Top Charts", array: charts },
		{ label: "New Releases", array: newRelease },
		{ label: "Editorial Picks", array: albums },
		{ label: "Trending Podcasts", array: podcasts },
		{ label: "Devotional", array: devotional },
		{ label: "Top Genres & Moods", array: topGenreAndMood },
		{ label: "Best of Society & Culture", array: bestofSocietyAndCulture },
		{ label: "New Releases Pop - Hindi", array: newReleasePop },
		{ label: "Top Albums - Hindi", array: topAlbums },
	];

	useEffect(() => {
		const fetchData = async () => {
			const _playlists = await api.getPlaylists(),
				_trending = await api.getTrending(),
				_charts = await api.getCharts(),
				_homeData = await api.getHomeData();

			setPlaylists(_playlists);
			setTrending(_trending);
			setCharts(_charts);
			setNewRelease(_homeData.newReleases);
			setAlbums(_homeData.editorialPicks);
			setPodcasts(_homeData.trendingPodcasts);
			setDevotional(_homeData.devotional);
			setTopGenreAndMood(_homeData.topGenreAndMood);
			setBestofSocietyAndCulture(_homeData.bestofSocietyAndCulture);
			setNewReleasePop(_homeData.newReleaseHindi);
			setTopAlbums(_homeData.topAlbumsHindi);
		};

		try {
			fetchData();
		} catch (error) {
			console.log("Unable to fetch Home Data: ", error);
		}
	}, []);

	return (
		<Box>
			<StyledSwiper source={playlists} isBanner={true} />
			{homeData.map(({ label, array }) => {
				return (
					array.length !== 0 && (
						<>
							<h2>{label}</h2>
							<StyledSwiper source={array} />
						</>
					)
				);
			})}
		</Box>
	);
};

export default Home;
