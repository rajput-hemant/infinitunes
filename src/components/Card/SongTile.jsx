import { FaPlay } from "react-icons/fa";
import { TbDownload } from "react-icons/tb";

import { Motion } from "../../styles/Motion";
import { decode } from "../../util/decodeHtml";
import { SongIcon, SongInfo, TileContainer } from "./SongTile.style";

const SongTile = ({
	name,
	image,
	duration,
	artists,
	download,
	onPlay,
	onClick,
}) => {
	const downloadSong = (song, name) => {
		const blob = new Blob([song], { type: "audio/mp4" });
		const href = URL.createObjectURL(blob);
		const a = Object.assign(document.createElement("a"), {
			href,
			style: "display:none",
			download: name + ".mp3",
		});
		document.body.appendChild(a);
		a.click();
		URL.revokeObjectURL(href);
		a.remove();
	};

	return (
		<Motion>
			<TileContainer onClick={onClick}>
				<SongIcon>
					<img src={image} alt={decode(name)} />
					<button onClick={onPlay}>
						<FaPlay size={25} color="#74f2ce" />
					</button>
				</SongIcon>
				<SongInfo>
					<h4>{decode(name)}</h4>
					<h5>{decode(artists)}</h5>
				</SongInfo>
				{duration && (
					<h4>{new Date(duration * 1000).toISOString().slice(14, 19)}</h4>
				)}
				<button onClick={() => downloadSong(download, decode(name))}>
					<TbDownload size={25} color="#74f2ce" />
				</button>
			</TileContainer>
		</Motion>
	);
};

export default SongTile;
