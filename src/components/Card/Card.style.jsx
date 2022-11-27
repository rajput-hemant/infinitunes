import styled from "styled-components";

export const CardContainer = styled.div`
	display: flex;
	width: 100% - 3rem;
	height: 21rem;
	overflow: hidden;
	margin: 8rem 3rem 1rem 3rem;
	color: white;
	font-size: 20px;
	font-family: Roboto, sans-serif;
`;

export const AlbumImage = styled.img`
	float: left;
	margin-right: 1rem;
	display: flex;
	height: 20rem;
	width: 18rem;
	border: 2px solid #74f2ce;
	border-radius: 10px;
	
	&:hover {
		box-shadow: 7px 7px 10px #74f2ce;
	}
`;

export const InfoContainer = styled.div`
	display: flex;
	flex-direction: column;
	flex: 1;
	height: 3rem;
	margin-left: 1rem;
	border-radius: 10px;
	height: 18rem;
`;

export const TitleContainer = styled.div`
	flex: 2;
	margin: 0 1rem;
	font-size: 4rem;
	color: white;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
	font-family: cubano, Roboto, sans-serif;

	&:hover {
		text-shadow: none;
		background: linear-gradient(#74f2ce, #7cffcb);
		-webkit-background-clip: text;
		background-clip: text;
	}
`;

export const ArtistsContiner = styled.div`
	flex: 1;
	margin: 0.5rem 1rem;
`;

export const LabelContainer = styled.div`
	flex: 1;
	margin: 0.5rem 1rem;
`;

export const ButtonContainer = styled.div`
	display: flex;
	flex: 2;
	align-items: center;
	margin: 0.5rem 1rem;
`;

export const PlayButton = styled.button`
	width: 10rem;
	height: 4rem;
	border-radius: 100px;
	/* color: white; */
	font-size: xx-large;
	font-family: cubano, Roboto, sans-serif;
	background: linear-gradient(
		90deg,
		${({ theme }) => theme.primaryStart},
		${({ theme }) => theme.primaryEnd}
	);
	border: none;

	&:active {
		scale: 0.98;
	}
`;
