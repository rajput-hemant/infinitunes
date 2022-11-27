import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import api from "../../api/JioSaavnApi";
import Card from "../../components/Card/Card";
import SongCard from "../../components/Card/SongsCard";

const Playlist = () => {
	const {
		state: { id, type },
	} = useLocation();

	const [playlist, setPlaylist] = useState([]);

	useEffect(() => {
		const fetchAlbum = async () => {
			const response = await api.getPlaylistDetails(id);
			setPlaylist(response);
		};
		try {
			fetchAlbum();
		} catch (error) {
			console.log("Unable to fetch Playlist: ", error);
		}
	}, [playlist.length, id]);

	return (
		<>
			<Card item={playlist} type={type}></Card>
			<SongCard item={playlist} />
		</>
	);
};

export default Playlist;
