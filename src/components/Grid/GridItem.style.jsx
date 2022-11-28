import styled from "styled-components";

export const GridItemCard = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: start;
	margin-bottom: 10px;

	div {
		height: 350px;
		width: 300px;

		img {
			border-radius: 10px;
			height: 300px;
			width: 300px;
			transition: all 150ms ease-in;
		}

		button {
			position: relative;
			top: -50%;
			left: 125px;
			border-radius: 10px;
			background: transparent;
			border: none;
			/* z-index: 100; */
			opacity: 0;
			transition: all 150ms ease-in;

			&:hover {
				scale: 1.2;
				cursor: pointer;
			}
		}

		&:hover img {
			opacity: 0.6;
			border: 3px solid #74f2ce;
			box-shadow: 7px 7px 10px #74f2ce;
		}

		&:hover button {
			opacity: 1;
		}

		h4 {
			position: relative;
			bottom: 50px;
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
			color: white;
			font-size: large;
			text-align: center;
			font-family: Roboto, sans-serif;

			&:hover {
				text-shadow: 2px 2px 10px #74f2ce;
			}
		}

		h5 {
			position: relative;
			bottom: 50px;
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
			color: grey;
			font-size: smaller;
			text-align: center;
			font-family: Roboto, sans-serif;
		}

		@media (max-width: 1230px) {
			height: 300px;
			width: 280px;

			div {
				img {
					height: 280px;
					width: 280px;
				}
			}
		}

		@media (max-width: 1100px) {
			height: 250px;
			width: 220px;
			div {
				img {
					height: 220px;
					width: 220px;
				}
			}
		}
	}
`;
