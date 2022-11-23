import { FaPlay, FaPause, FaStepForward, FaStepBackward } from "react-icons/fa";
import { TbArrowsShuffle, TbRepeat, TbRepeatOnce } from "react-icons/tb";

import {
	CenterContainer,
	MainContainer,
	IconButton,
	LeftContainer,
	RightContainer,
} from "./Player.style";

const Player = () => {
	return (
		<MainContainer>
			<LeftContainer />
			<CenterContainer>
				<IconButton>
					<TbRepeat size={30} color="white" />
					{/* <TbRepeatOnce size={30} color="white" /> */}
				</IconButton>
				<IconButton>
					<FaStepBackward size={25} color="white" />
				</IconButton>
				<IconButton>
					<FaPlay size={25} color="white" />
					{/* <FaPause size={25} color="white" /> */}
				</IconButton>
				<IconButton>
					<FaStepForward size={25} color="white" />
				</IconButton>
				<IconButton>
					<TbArrowsShuffle size={30} color="white" />
				</IconButton>
			</CenterContainer>
			<RightContainer />
		</MainContainer>
	);
};

export default Player;
