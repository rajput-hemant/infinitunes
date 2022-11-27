import { SongCardContainer } from "./SongsCard.style";
import Tile from "./SongTile";

const SongCard = (props) => {
	const songs = props.item.songs;
	return (
		props.item.length !== 0 && (
			<SongCardContainer>
				{songs.map((song) => {
					return (
						<Tile
							name={song.name}
							artists={song.primaryArtists}
							image={song.image[1].link}
						/>
					);
				})}
			</SongCardContainer>
		)
	);
};

export default SongCard;
