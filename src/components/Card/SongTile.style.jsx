import styled from "styled-components";

export const SongIcon = styled.img`
	height: 4.5rem;
	width: 4.5rem;
	border-radius: 10px;
	transition: all 200ms ease-in;
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

export const TileContainer = styled.div`
	display: flex;
	height: 5rem;
	margin: 3px 0;
	padding: 0 5px;
	border: none;
	align-items: center;
	border-radius: 10px;
	background-color: transparent;
	transition: all 200ms ease-in;

	&:hover {
		border: 1px solid white;
		cursor: pointer;
		box-shadow: 3px 3px 5px #74f2ce;
	}

	button {
		position: relative;
		left: -45px;
		top: -24px;
		border-radius: 10px;
		background: transparent;
		border: none;
		z-index: 100;
		opacity: 0;
		transition: all 150ms ease-in;
		&:active {
			transform: scale(1.3);
		}
	}

	div {
		&:hover button {
			opacity: 1;
			cursor: pointer;
		}
	}
`;
