import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import api from "../../api/JioSaavnApi";
import Card from "../../components/Card/Card";
import SongCard from "../../components/Card/SongsCard";

const Album = () => {
	const {
		state: { id },
	} = useLocation();

	const [album, setAlbum] = useState([]);

	useEffect(() => {
		const fetchAlbum = async () => {
			const response = await api.getAlbumDetails(id);
			setAlbum(response);
		};
		try {
			fetchAlbum();
		} catch (error) {
			console.log("Unable to fetch Albums: ", error);
		}
	}, [album.length, id]);

	return (
		<>
			<Card item={album}></Card>
			<SongCard item={album} />
		</>
	);
};

export default Album;
