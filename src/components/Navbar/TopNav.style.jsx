import { NavLink } from "react-router-dom";
import styled from "styled-components";

export const Logo = styled.img`
	/* margin: 0 10px; */
	position: relative;
	top: -3px;
	width: 100px;
	background: transparent;
	animation: spinY 2s linear infinite;
	@keyframes spinY {
		0% {
			transform: rotateY(0deg);
		}

		100% {
			transform: rotateY(360deg);
		}
	}

	&:hover {
		animation: spinZ 2s linear infinite;
		scale: 1.2;
	}

	@keyframes spinZ {
		from {
			transform: rotateZ(0deg);
		}
		to {
			transform: rotateZ(360deg);
		}
	}
`;

export const MainContainer = styled.nav`
	z-index: 999; // To keep player/footer upfront
	display: flex;
	align-items: center;
	margin: 15px;
	position: fixed;
	top: 0px;
	width: calc(100vw - 30px);
	height: 60px;
	border-radius: 10px;
	background-color: rgba(0, 21, 28, 0.3);
	background-image: linear-gradient(
		90deg,
		rgba(255, 255, 255, 0.09),
		rgba(0, 21, 28, 0.3)
	);
	box-shadow: 20px 20px 40px #000000bd;
	backdrop-filter: blur(12px);
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
	text-shadow: 2px 2px 5px black;
	margin: 10px;
	font-family: "cubano";
	font-size: x-large;
	/* background: none; */

	&:hover {
		text-shadow: none;
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
	box-shadow: 2px 2px 5px;
	background-color: rgba(0, 21, 28, 0.15);
	backdrop-filter: blur(8px);

	&:focus-within {
		background-color: rgba(0, 21, 28, 0.1);
		width: 550px;
		box-shadow: 2px 2px 10px;
	}

	&:hover {
		scale: 1.1;
		box-shadow: 5px 5px 10px;
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
		color: white;
	}
`;

export const IconButton = styled.button`
	position: relative;
	margin: 5px;
	width: 30px;
	border: none;
	cursor: pointer;
	background: none;
	z-index: 1;

	&:hover {
		animation: spinZ 2s linear 2;
	}

	@keyframes spinZ {
		from {
			transform: rotateZ(0deg);
		}
		to {
			transform: rotateZ(360deg);
		}
	}
`;

export const SearchIconContainer = styled.div`
	display: flex;
	padding-left: 5px;
	align-items: center;
`;
