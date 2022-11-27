import {
	AlbumImage,
	CardContainer,
	InfoContainer,
	TitleContainer,
	ArtistsContainer,
	LabelContainer,
	ButtonsContainer,
	PlayButton,
} from "./Card.style";

const Card = (props) => {
	const item = props.item,
		type = props.type;

	const getTotalPlays = (songs) => {
		const plays = songs.reduce((a, b) => a + +b.playCount, 0);
		return new Intl.NumberFormat().format(plays);
	};

	const getTotalDuration = (songs) => {
		const duration = songs.reduce((a, b) => a + +b.duration, 0);
		const [hrs, mins] = (duration / 60).toFixed(2).toString().split(".");
		return `${hrs}:${mins}`;
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

	return (
		item.length !== 0 && (
			<CardContainer>
				<AlbumImage src={item.image[2]?.link} alt={item.name}></AlbumImage>
				<InfoContainer>
					<TitleContainer>{item.name}</TitleContainer>
					{subtitle()}
					<LabelContainer>{item.songs[0]?.copyright}</LabelContainer>
					<ButtonsContainer>
						<PlayButton
							onClick={() => console.log(item.songs[0]?.downloadUrl[4].link)}
						>
							Play
						</PlayButton>
					</ButtonsContainer>
				</InfoContainer>
			</CardContainer>
		)
	);
};

export default Card;
