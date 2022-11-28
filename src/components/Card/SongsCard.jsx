import { SongCardContainer } from "./SongsCard.style";
import SongTile from "./SongTile";

const SongCard = (props) => {
	const songs = props.item.songs;
	return (
		props.item.length !== 0 && (
			<SongCardContainer>
				{songs.map((song) => {
					return (
						<SongTile
							key={song.id}
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
