import { useEffect, useState } from "react";

import api from "../../api/JioSaavnApi";
import Grid from "../../components/Grid/Grid";

const Playlists = () => {
	const [playlists, setPlaylists] = useState([]);

	useEffect(() => {
		const fetchCharts = async () => {
			const playlists = await api.getPlaylists(),
				editorialPicks = await api.getEditorialPicks();
			setPlaylists([...editorialPicks, ...playlists]);
		};
		try {
			fetchCharts();
		} catch (error) {
			console.log("Unable to fetch Playlists: ", error);
		}
	}, [playlists.length]);

	return <Grid source={playlists} />;
};

export default Playlists;
