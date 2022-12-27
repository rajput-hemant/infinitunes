import { FaPlay, FaPause, FaStepForward, FaStepBackward } from "react-icons/fa";
import { TbArrowsShuffle, TbRepeat } from "react-icons/tb";

import { ControlsContainer, IconButton } from "./Controls.style";

const Controls = ({ toggle, isPlaying }) => {
	return (
		<ControlsContainer>
			<IconButton>
				<TbRepeat size={30} color="white" />
				{/* <TbRepeatOnce size={30} color="white" /> */}
			</IconButton>
			<IconButton>
				<FaStepBackward size={25} color="white" />
			</IconButton>
			<IconButton onClick={toggle}>
				{isPlaying ? (
					<FaPause size={25} color="white" />
				) : (
					<FaPlay size={25} color="white" />
				)}
			</IconButton>
			<IconButton>
				<FaStepForward size={25} color="white" />
			</IconButton>
			<IconButton>
				<TbArrowsShuffle size={30} color="white" />
			</IconButton>
		</ControlsContainer>
	);
};

export default Controls;
