import { Menu } from "@headlessui/react";
import styled from "styled-components";

export const StyledMenu = styled(Menu)``;

export const MenuButton = styled(Menu.Button)`
	display: inline-flex;
	background: transparent;
	justify-content: center;
	border: none;

	:hover {
	}
`;

export const MenuItems = styled(Menu.Items)`
	padding: 10px 0;
	position: absolute;
	right: 3rem;
	top: 3rem;
	width: auto;
	border-radius: 10px;
	text-align: center;
	transform-origin: top right;
	background-color: rgba(0, 21, 28, 0.3);
	background-image: linear-gradient(
		90deg,
		rgba(255, 255, 255, 0.09),
		rgba(0, 21, 28, 0.3)
	);
	box-shadow: 20px 20px 40px #000000bd;
	backdrop-filter: blur(12px);
`;

export const MenuItem = styled(Menu.Item)`
	display: flex;
	padding: 10px;
	text-decoration: none;
	color: white;
	text-shadow: 2px 2px 5px black;
	margin: 10px;
	font-family: "cubano";
	font-size: 25px;

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

	span {
		padding: 0 4px;
	}
`;

// export const StyledSwitch = styled(Switch)`
// 	background: ${({ enabled }) => (enabled ? "grey" : "teal")};
// 	display: inline-flex;
// 	position: relative;
// 	transition-duration: 500ms;
// 	border-radius: 100px;
// 	border-color: transparent;
// 	cursor: pointer;
// 	height: 38px;
// 	width: 74px;
// `;

// export const StyledSpan = styled.span`
// 	/* display: inline-block; */
// 	transform: ${({ enabled }) =>
// 		enabled ? `translateX(36px)` : `translateX(0px)`};
// 	background-color: #fff;
// 	transition-duration: 500ms;
// 	border-radius: 100px;
// 	height: 34px;
// 	width: 34px;
// `;
