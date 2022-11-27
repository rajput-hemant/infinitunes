import {
	AlbumImage,
	CardContainer,
	InfoContainer,
	TitleContainer,
	ArtistsContiner,
	LabelContainer,
	ButtonContainer,
	PlayButton,
} from "./Card.style";

const Card = (props) => {
	const item = props.item;

	const getTotalPlays = (songs) => {
		const plays = songs.reduce((a, b) => a + +b.playCount, 0);
		return new Intl.NumberFormat().format(plays);
	};

	const getTotalDuration = (songs) => {
		const duration = songs.reduce((a, b) => a + +b.duration, 0);
		const [hrs, mins] = (duration / 60).toFixed(2).toString().split(".");
		return `${hrs}:${mins}`;
	};

	return (
		item.length !== 0 && (
			<CardContainer>
				<AlbumImage src={item.image[2].link} alt={item.name}></AlbumImage>
				<InfoContainer>
					<TitleContainer>{item.name}</TitleContainer>
					<ArtistsContiner>
						{item.primaryArtist} · {item.songCount} Songs ·{" "}
						{getTotalPlays(item.songs)} Plays · {getTotalDuration(item.songs)}
					</ArtistsContiner>
					<LabelContainer>{item.songs[0].copyright}</LabelContainer>
					<ButtonContainer>
						<PlayButton
							onClick={() => console.log(item.songs[0].downloadUrl[4].link)}
						>
							Play
						</PlayButton>
					</ButtonContainer>
				</InfoContainer>
			</CardContainer>
		)
	);
};

export default Card;
