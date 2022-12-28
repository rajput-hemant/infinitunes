import { FaPlay, FaPause, FaStepForward, FaStepBackward } from "react-icons/fa";
import { TbArrowsShuffle, TbRepeat, TbRepeatOnce } from "react-icons/tb";

import { ControlsContainer, IconButton } from "./Controls.style";

const Controls = ({ toggle, isPlaying, loop, loopToggle, seekFw, seekBw }) => {
	return (
		<ControlsContainer>
			<IconButton onClick={loopToggle}>
				{loop ? (
					<TbRepeatOnce size={30} color="white" />
				) : (
					<TbRepeat size={30} color="white" />
				)}
			</IconButton>
			<IconButton onClick={seekBw}>
				<FaStepBackward size={25} color="white" />
			</IconButton>
			<IconButton onClick={toggle}>
				{isPlaying ? (
					<FaPause size={25} color="white" />
				) : (
					<FaPlay size={25} color="white" />
				)}
			</IconButton>
			<IconButton onClick={seekFw}>
				<FaStepForward size={25} color="white" />
			</IconButton>
			<IconButton>
				<TbArrowsShuffle size={30} color="white" />
			</IconButton>
		</ControlsContainer>
	);
};

export default Controls;
