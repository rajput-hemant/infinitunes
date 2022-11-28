import { FaPlay } from "react-icons/fa";

import { SongIcon, SongInfo, TileContainer } from "./SongTile.style";
import { Motion } from "../../styles/Motion";

const Tile = (props) => {
	return (
		<Motion>
			<TileContainer onClick={() => console.log(props.name)}>
				<div>
					<SongIcon src={props.image} />
					<button>
						<FaPlay size={25} color="#74f2ce" />
					</button>
				</div>
				<SongInfo>
					<h4>{props.name}</h4>
					<h5>{props.artists}</h5>
				</SongInfo>
			</TileContainer>
		</Motion>
	);
};

export default Tile;
