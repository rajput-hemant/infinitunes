import JSZip from "jszip";
import JSZipUtils from "jszip-utils";
import saveAs from "file-saver";

import { decode } from "../../util/decodeHtml";
import {
	AlbumImage,
	StyledButton,
	CardContainer,
	InfoContainer,
	LabelContainer,
	TitleContainer,
	ArtistsContainer,
	ButtonsContainer,
} from "./Card.style";

const Card = ({ item, type }) => {
	const getTotalPlays = (songs) => {
		const plays = songs.reduce((a, b) => a + +b.playCount, 0);
		return new Intl.NumberFormat().format(plays);
	};

	const getTotalDuration = (songs) => {
		const duration = songs.reduce((a, b) => a + +b.duration, 0);
		return `${new Date(duration * 1000).toISOString().slice(11, 19)} Hrs`;
	};

	const subtitle = () => {
		if (type === "album" || "show")
			return (
				<ArtistsContainer>
					{type === "albums" ? item.primaryArtist : "Podcast"} ·{" "}
					{item.songCount} Songs · {getTotalPlays(item.songs)} Plays ·{" "}
					{getTotalDuration(item.songs)}
				</ArtistsContainer>
			);

		if (type === "playlist" || "featured")
			return (
				<ArtistsContainer>
					{(item.fanCount / 1000).toFixed(2)}K Fans · {item.songCount} Songs ·{" "}
					{getTotalPlays(item.songs)} Plays · {getTotalDuration(item.songs)}
				</ArtistsContainer>
			);
	};

	const downloadPlaylist = async (playlist, name) => {
		const data = playlist.songs.map((song) => {
			return {
				name: decode(song.name),
				link: song.downloadUrl[0].link,
			};
		});

		const zip = new JSZip();
		let count = 0;
		data.forEach(async (song) => {
			try {
				const file = await JSZipUtils.getBinaryContent(song.link);
				zip.file(song.name + ".mp3", file, { binary: true });
				count++;
				if (count === data.length) {
					zip.generateAsync({ type: "blob" }).then(function (content) {
						saveAs(content, name);
					});
				}
			} catch (err) {
				console.log(err);
			}
		});
	};

	return (
		item.length !== 0 && (
			<CardContainer>
				<AlbumImage>
					<img src={item.image[2]?.link} alt={item.name} />
				</AlbumImage>
				<InfoContainer>
					<TitleContainer>{item.name}</TitleContainer>
					{subtitle()}
					<LabelContainer>{item.songs[0]?.copyright}</LabelContainer>
					<ButtonsContainer>
						<StyledButton onClick={() => downloadPlaylist(item, item.name)}>
							Play
						</StyledButton>
						<StyledButton onClick={() => downloadPlaylist(item, item.name)}>
							Download
						</StyledButton>
					</ButtonsContainer>
				</InfoContainer>
			</CardContainer>
		)
	);
};

export default Card;
