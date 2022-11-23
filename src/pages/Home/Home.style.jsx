import styled from "styled-components";
import { Swiper, SwiperSlide } from "swiper/react";

export const Box = styled.div`
	padding: 120px 15px 0 15px;

	h2 {
		font-family: cubano;
		font-weight: 500;
		color: white;
		padding: 10px 0;
	}
`;

export const StyledSwiper = styled(Swiper)`
	border-radius: 10px;
	height: 350px;
	width: 100%;
	background-color: transparent;
	/* background-color: rgba(0, 21, 28, 0.7);
	background-image: linear-gradient(
		90deg,
		rgba(255, 255, 255, 0.09),
		rgba(255, 255, 255, 0.09)
	);
	backdrop-filter: blur(10px);
	box-shadow: rgb(0 0 0) 0px 50px 100px -25px; */
`;

export const StyledSlider = styled(SwiperSlide)`
	display: flex;
	width: 100%;
	font-size: 18px;
	max-height: 100px;

	img {
		border-radius: 10px;
		width: 350px;
		height: 350px;
		/* object-fit: cover; */
	}
`;
