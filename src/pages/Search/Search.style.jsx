import styled from "styled-components";

export const SearchContainer = styled.div`
	display: flex;
	flex-direction: column;
	margin: 6.5rem 20rem;

	h2 {
		color: white;
		font-size: 30px;
		font-weight: 100;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		font-family: cubano, Roboto, sans-serif;
	}

	em {
		font-family: Roboto, sans-serif;
		color: ${({ theme }) => theme.primaryStart};
	}
`;

export const SearchNav = styled.div`
	display: flex;
	height: 5rem;
	align-items: flex-end;
	width: 100%;
	border-bottom: 2px solid gray;
`;

export const NavBtn = styled.button`
	height: 3rem;
	width: 100%;
	margin: 0 7rem;
	font-weight: 100;
	color: white;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
	font-size: x-large;
	border: none;
	border-radius: 10px 10px 0 0;
	background: none;
	font-family: cubano;
	cursor: pointer;

	&:active {
		background: linear-gradient(
			90deg,
			${({ theme }) => theme.primaryStart},
			${({ theme }) => theme.primaryEnd}
		);
		color: black;
	}
`;

export const SearchTilesContainer = styled.div`
	margin: 2rem 4rem;
	overflow: auto;
	padding: 20px;
	border-radius: 10px;
	/* border: 2px solid grey; */
	border-left: 2px solid grey;
	border-right: 2px solid grey;
	box-shadow: 2px 2px 20px ${({ theme }) => theme.primaryStart};
`;
