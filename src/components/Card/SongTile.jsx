import { SongIcon, SongInfo, TileContainer } from "./SongTile.style";

const Tile = (props) => {
	return (
		<TileContainer>
			<SongIcon src={props.image} />
			<SongInfo>
				<h4>{props.name}</h4>
				<h5>{props.artists}</h5>
			</SongInfo>
		</TileContainer>
	);
};

export default Tile;
