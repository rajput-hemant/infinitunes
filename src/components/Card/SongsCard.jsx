import { useDispatch } from "react-redux";

import SongTile from "./SongTile";
import { decode } from "../../util/decodeHtml";
import { SongCardContainer } from "./SongsCard.style";
import { playerActions } from "../../store/player-slice";

const SongCard = ({ item }) => {
	const songs = item.songs;
	const dispatch = useDispatch();

	const onPlayHandler = (src, image, title, artist) => {
		dispatch(
			playerActions.SET_SONG_DATA({
				image,
				src,
				title: decode(title),
				artist: decode(artist),
			})
		);
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
							onPlay={() =>
								onPlayHandler(
									song.downloadUrl[4]?.link || "",
									song.image[1]?.link || "",
									song.name || "",
									song.artist || ""
								)
							}
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
