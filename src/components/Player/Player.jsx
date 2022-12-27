import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import Controls from "./Controls";
import { playerActions } from "../../store/player-slice";
import {
	Box,
	MainContainer,
	LeftContainer,
	RightContainer,
} from "./Player.style";

const player = new Audio();

const Player = () => {
	const dispatch = useDispatch();
	const { songSrc, isPlaying } = useSelector((state) => state.player);

	useEffect(() => {
		player.src = songSrc;
		if (songSrc) player.play();
	}, [songSrc]);

	useEffect(() => {
		isPlaying ? player.play() : player.pause();
	}, [isPlaying]);

	useEffect(() => {
		player.addEventListener("ended", () => {
			dispatch(playerActions.PAUSE());
		});
		return () => {
			player.removeEventListener("ended", () => {
				dispatch(playerActions.PAUSE());
			});
		};
	}, [dispatch]);

	const toggle = () => {
		isPlaying && songSrc
			? dispatch(playerActions.PAUSE())
			: dispatch(playerActions.PLAY());
	};

	return (
		<MainContainer>
			<LeftContainer />
			<Controls toggle={toggle} isPlaying={isPlaying} />
			<RightContainer />
		</MainContainer>
	);
};

export default Player;
