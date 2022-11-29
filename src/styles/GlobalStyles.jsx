import { createGlobalStyle } from "styled-components";

import LRegular from "../assets/fonts/L-Regular.ttf";
import Cubano from "../assets/fonts/Cubano.ttf";

export const themes = {
	light: {
		body: "#fff",
		text: "#000",
		primaryStart: "",
		primaryEnd: "",
		secondaryStart: "",
		secondaryEnd: "",
	},

	// dark: {
	// 	body: "#121212",
	// 	text: "#fff",
	// 	primaryStart: "#bb86fc",
	// 	primaryEnd: "#03dac6",
	// 	secondaryStart: "",
	// 	secondaryEnd: "",
	// 	error: "#cf6679",
	// },

	dark: {
		body: "#12181b",
		text: "#fff",
		primaryStart: "#74f2ce",
		primaryEnd: "#7cffcb",
		secondaryStart: "#ffffff16",
		secondaryEnd: "#00151c",
	},
};

const GlobalStyle = createGlobalStyle`
  * {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}

body {
	/* background-color: #000; */
	background: ${({ theme }) => theme.body};
	background: linear-gradient(#434343, #000000, 90deg);
}

::-webkit-scrollbar {
	height: 4px;
	width: 4px;
}

::-webkit-scrollbar-track {
  box-shadow: inset 0 0 5px grey;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
	background: #289174;
	border-radius: 10px;
	
	:hover{
		background: #43bf9c;
	}
}

@font-face {
	font-family: "cubano";
	src: url(${Cubano})
}

@font-face {
	font-family: "l-regular";
	src: url(${LRegular})
}
`;

export default GlobalStyle;
