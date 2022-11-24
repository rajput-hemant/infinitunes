import styled from "styled-components";
import { Swiper, SwiperSlide } from "swiper/react";

export const SwiperComponent = styled(Swiper)`
	border-radius: 10px;
	height: ${(props) => (props.isbanner ? "350px" : "300px")};
	width: ${(props) => (props.isbanner ? "100%" : "90%")};
	background-color: transparent;
`;

export const StyledSlider = styled(SwiperSlide)`
	display: flex;
	width: 100%;
	font-size: 18px;
	max-height: 100px;

	img {
		border-radius: 10px;
		width: ${(props) => (props.isbanner ? "350px" : "300px")};
		height: ${(props) => (props.isbanner ? "350px" : "300px")};
		/* object-fit: cover; */

		/* &:hover {
			border: 2px;
			border-color: #43bf9c;
		} */
	}
`;
