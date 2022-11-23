import { NavLink } from "react-router-dom";
import styled from "styled-components";

export const Logo = styled.img`
	/* margin: 0 10px; */
	position: relative;
	top: -3px;
	width: 100px;
	background: transparent;

	&:hover {
		scale: 1.2;
		animation-name: spin;
		animation-duration: 2s;
		animation-iteration-count: 10;
		animation-timing-function: ease-out;
		/* transform: rotate(3deg); */
		/* transform: rotate(0.3rad); */
		/* transform: rotate(3grad); */
		/* transform: rotate(.03turn);  */
	}

	@keyframes spin {
		from {
			transform: rotateZ(0deg);
		}
		to {
			transform: rotateZ(360deg);
		}
	}
`;

export const MainContainer = styled.nav`
	display: flex;
	align-items: center;
	margin: 15px;
	position: fixed;
	top: 0px;
	width: calc(100vw - 30px);
	height: 60px;
	border-radius: 10px;
	background-color: rgb(0, 21, 28);
	background-image: linear-gradient(
		90deg,
		rgba(255, 255, 255, 0.09) 0%,
		rgb(0, 21, 28) 100%
	);
	box-shadow: rgb(0 0 0) 0px 50px 100px -25px;
	backdrop-filter: blur(10px);
`;

export const LeftContainer = styled.nav`
	flex: 0.5;
	display: flex;
	align-items: center;
	background: transparent;
	/* padding-left: 2%; */
`;

export const RightContainer = styled.nav`
	flex: 0.5;
	align-items: center;
	display: flex;
	background: transparent;
	justify-content: flex-end;
	padding-right: 2%;
`;

export const LinkContainer = styled.div`
	display: flex;
	background: transparent;
`;

export const StyledLink = styled(NavLink)`
	text-decoration: none;
	color: white;
	margin: 10px;
	font-family: "cubano";
	font-size: x-large;
	/* background: none; */

	&:hover {
		scale: 1.05;
		background: linear-gradient(#74f2ce, #7cffcb);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	&:active {
		scale: 1.05;
		background: linear-gradient(#74f2ce, #7cffcb);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
	}
`;

export const SearchContainer = styled.div`
	/* position: relative; */
	justify-content: center;
	width: 360px;
	height: 40px;
	background: none;
	border-radius: 10px;
	display: flex;
	justify-content: space-between;
	transition: all 0.3s ease-out;
	background-color: rgba(0, 21, 28, 0.7);
	background-image: linear-gradient(
		rgba(255, 255, 255, 0.09),
		rgba(255, 255, 255, 0.09)
	);

	&:focus-within {
		width: 550px;
	}

	&:hover {
		background: linear-gradient(90deg, rgb(10, 61, 69), rgb(14, 77, 81) 100%);
		box-shadow: rgb(14 77 81 / 70%) 0px 0px 0px 1px;
	}
`;

export const SearchInput = styled.input`
	padding: 5px;
	color: white;
	border: none;
	/* top: 0;
	left: 0; */
	font-family: l-regular;
	/* font-weight: bold; */
	width: 100%;
	background: none;
	outline: none;
	font-size: 15px;
	border: none;

	&::placeholder {
		color: gray;
	}
`;

export const IconButton = styled.button`
	position: relative;
	width: 30px;
	border: none;
	margin-right: 5px;
	cursor: pointer;
	background: none;
	z-index: 1;

	&:hover {
		color: white;
		scale: 1.05;
		&::after {
			opacity: 1;
			transform: scale(1);
		}
	}

	&::after {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		border-radius: 50%;
		z-index: 1;
		background: none;
		transition: 0.3s ease;
		transform: scale(0.6);
		opacity: 0;
	}
`;

export const SearchIconContainer = styled.div`
	display: flex;
	padding-left: 5px;
	align-items: center;
`;
