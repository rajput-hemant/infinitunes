import styled from "styled-components";

export const MainContainer = styled.footer`
	z-index: 999; // To keep player/footer upfront
	display: flex;
	position: fixed;
	bottom: 0;
	align-items: center;
	margin: 15px;
	width: calc(100vw - 30px);
	height: 60px;
	border-radius: 10px;
	background-color: rgba(0, 21, 28, 0.3);
	background-image: linear-gradient(
		90deg,
		rgba(255, 255, 255, 0.09),
		rgba(0, 21, 28, 0.3)
	);
	box-shadow: 2px 2px 15px ${({ theme }) => theme.primaryStart};
	backdrop-filter: blur(12px);
`;

export const LeftContainer = styled.div`
	flex: 1;
	display: flex;
	align-items: center;
	background: transparent;
	padding-left: 2%;

	img {
		height: 3rem;
		width: 3rem;
		border-radius: 100px;
		animation: ${({ isActive }) =>
			isActive ? "spinZ 5s linear infinite" : "none"};

		@keyframes spinZ {
			from {
				transform: rotateZ(0deg);
			}
			to {
				transform: rotateZ(360deg);
			}
		}
	}

	div {
		padding: 0 1rem;
		width: 25rem;
		color: white;
		overflow: hidden;
		white-space: nowrap;

		h3 {
			font-size: medium;
			font-weight: 500;
			font-family: "cubano";
		}

		h4 {
			color: white;
			font-size: small;
		}
	}
`;

export const RightContainer = styled.div`
	flex: 1;
	display: flex;
	align-items: center;
	background: transparent;
	justify-content: space-around;
	padding-right: 2%;

	input {
		margin: 0 1rem;
		position: relative;
		appearance: none;
		background: #ffffff3b;
		border-radius: 20px;
		height: 4px;
		width: 100%;
		pointer-events: auto;
		outline: none;

		&::before {
			content: "";
			border-radius: 20px;
			height: 4px;
			width: ${({ currentTime }) => currentTime};
			background: ${({ theme }) => theme.primaryStart};
			cursor: pointer;
			position: absolute;
			top: 0;
			left: 0;
			z-index: 2;
			cursor: pointer;
		}

		&::-webkit-slider-thumb {
			-webkit-appearance: none;
			height: 15px;
			width: 15px;
			border: none;
			cursor: pointer;
			border-radius: 50%;
			background: ${({ theme }) => theme.primaryEnd};
		}
	}

	h3 {
		color: white;
		font-size: medium;
		font-weight: 500;
		font-family: "cubano";
	}
`;
