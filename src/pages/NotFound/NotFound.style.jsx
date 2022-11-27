import { NavLink } from "react-router-dom";
import styled from "styled-components";

export const NotFoundContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	margin: 5rem;

	img {
		width: 70rem;
	}

	h3 {
		padding: 5px 0;
		color: white;
		font-size: 3rem;
		font-weight: 200;
		font-family: cubano, Roboto, sans-serif;
	}

	h4 {
		padding: 5px 0;
		color: white;
		font-size: 2rem;
		font-weight: 200;
		font-style: italic;
		font-family: Roboto, sans-serif;
	}
`;

export const RecommendWrapper = styled.div`
	display: flex;
	flex-direction: row;
`;

export const StyledLink = styled(NavLink)`
	text-decoration: none;
	color: white;
	text-shadow: 2px 2px 5px black;
	margin: 10px;
	font-style: italic;
	font-size: x-large;
	font-family: "cubano", Roboto, sans-serif;

	&:hover {
		text-shadow: none;
		scale: 1.05;
		background: linear-gradient(#74f2ce, #7cffcb);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
	}
`;
