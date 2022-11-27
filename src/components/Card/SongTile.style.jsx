import styled from "styled-components";

export const TileContainer = styled.button`
	display: flex;
	height: 5rem;
	margin: 1px 0;
	padding: 0 5px;
	border: none;
	align-items: center;
	border-radius: 10px;
	background-color: transparent;

	&:hover {
		border: 1px solid white;
		cursor: pointer;
		box-shadow: 3px 3px 5px #74f2ce;
	}
`;

export const SongIcon = styled.img`
	height: 4.5rem;
	width: 4.5rem;
	border-radius: 10px;
`;

export const SongInfo = styled.div`
	display: flex;
	flex: 5;
	padding: 0 1rem;
	flex-direction: column;
	text-align: start;
	justify-content: center;
	height: 4.5rem;
	border-radius: 10px;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
	font-family: Roboto, sans-serif;

	h4 {
		font-size: 22px;
		padding: 5px 0;
		color: white;
	}

	h5 {
		font-size: 15px;
		padding: 5px 0;
		color: gray;

		&:hover {
			color: white;
		}
	}
`;
