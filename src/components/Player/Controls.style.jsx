import styled from "styled-components";

export const ControlsContainer = styled.div`
	flex: 1;
	display: flex;
	align-items: center;
	background: transparent;
	justify-content: center;
`;

export const IconButton = styled.button`
	padding: 15px;
	background: none;
	border: none;
	cursor: pointer;

	&:hover {
		color: white;
		scale: 1.3;
		&::after {
			opacity: 1;
			transform: scale(1);
		}
	}
`;
