import styled from "styled-components";

export const SongIcon = styled.div`
	display: flex;
	height: 4.5rem;
	width: 4.5rem;

	img {
		height: 4.5rem;
		width: 4.5rem;
		border-radius: 5px;
		transition: all 200ms ease-in;
	}

	button {
		position: relative;
		left: -65%;
		top: auto;
		opacity: 0;
	}

	&:hover button {
		opacity: 1;
	}
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
	padding: 0 20px 0 5px;
	border: none;
	align-items: center;
	border-radius: 10px;
	background-color: transparent;
	transition: all 200ms ease-in;
	border: 1px solid gray;

	&:hover {
		box-shadow: 3px 3px 5px #74f2ce;
		scale: 1.01;
	}

	&:active {
		scale: 1;
	}

	button {
		background: transparent;
		border: none;
		z-index: 100;
		transition: all 150ms ease-in;

		&:hover {
			scale: 1.3;
			cursor: pointer;
		}

		&:active {
			scale: 1;
		}
	}

	h4 {
		font-size: 22px;
		padding: 5px 20px 5px 0;
		color: white;
	}
`;
