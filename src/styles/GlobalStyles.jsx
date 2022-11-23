import { createGlobalStyle } from "styled-components";
import LRegular from "../assets/fonts/L-Regular.ttf";
import Cubano from "../assets/fonts/Cubano.ttf";

const GlobalStyle = createGlobalStyle`
  * {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}

body {
	background-color: #12181b;
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
