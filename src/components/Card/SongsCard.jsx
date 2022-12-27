import { useDispatch } from "react-redux";

import SongTile from "./SongTile";
import { SongCardContainer } from "./SongsCard.style";
import { playerActions } from "../../store/player-slice";

const SongCard = ({ item }) => {
	const songs = item.songs;
	const dispatch = useDispatch();

	const onPlayHandler = (url) => {
		dispatch(playerActions.SET_SONG_SRC(url));
		dispatch(playerActions.PLAY());
	};

	return (
		item.length !== 0 && (
			<SongCardContainer>
				{songs.map((song) => {
					return (
						<SongTile
							key={song.id}
							name={song.name}
							onPlay={() => onPlayHandler(song.downloadUrl[4]?.link || "")}
							artists={song.primaryArtists}
							image={song.image[1].link}
							duration={song.duration}
							download={song.downloadUrl[1]?.link || false}
						/>
					);
				})}
			</SongCardContainer>
		)
	);
};

export default SongCard;
