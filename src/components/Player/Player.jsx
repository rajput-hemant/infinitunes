import { useRef, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import Controls from "./Controls";
import { playerActions } from "../../store/player-slice";
import { MainContainer, LeftContainer, RightContainer } from "./Player.style";

const player = new Audio();

const Player = () => {
	const dispatch = useDispatch();
	const progressBar = useRef();
	const [loop, setLoop] = useState(false);
	const [duration, setDuration] = useState({ total: 0, elapsed: 0 });

	const {
		songData: { src, image, title, artist },
		isPlaying,
	} = useSelector((state) => state.player);

	useEffect(() => {
		player.src = src;
		if (src) player.play();
	}, [src]);

	useEffect(() => {
		isPlaying ? player.play() : player.pause();
	}, [isPlaying]);

	useEffect(() => {
		player.loop = loop;
		
		player.addEventListener("ended", () => {
			if (!loop) dispatch(playerActions.PAUSE());
		});

		return () => {
			player.removeEventListener("ended", () => {
				if (!loop) dispatch(playerActions.PAUSE());
			});
		};
	}, [dispatch, loop]);

	const formatDuration = (seconds) => {
		return new Date(Math.floor(seconds || 0) * 1000)
			.toISOString()
			.slice(14, 19);
	};

	useEffect(() => {
		progressBar.current.max = Math.floor(player.duration);

		setDuration({
			total: formatDuration(player.duration),
			elapsed: formatDuration(player.currentTime),
		});
	}, [player.currentTime, player.duration]);

	const playPauseToggle = () => {
		isPlaying && src
			? dispatch(playerActions.PAUSE())
			: dispatch(playerActions.PLAY());
	};

	const changeRange = () => {
		player.currentTime = progressBar.current.value;
	};

	const seekFw = () => {
		player.currentTime += 10;
	};

	const seekBw = () => {
		player.currentTime -= 10;
	};

	const loopToggle = () => {
		setLoop((prevState) => !prevState);
	};

	return (
		<MainContainer>
			<LeftContainer
				isActive={isPlaying}
				currentTime={
					(progressBar?.current?.value / progressBar?.current?.max) * 100
				}
			>
				{image && <img src={image} alt={title} />}
				<div>
					<h3>{title}</h3>
					<h4>{artist}</h4>
				</div>
			</LeftContainer>
			<Controls
				toggle={playPauseToggle}
				isPlaying={isPlaying ? 1 : 0}
				loopToggle={loopToggle}
				loop={loop}
				seekFw={seekFw}
				seekBw={seekBw}
			/>
			<RightContainer>
				<h3>{duration.elapsed || "00:00"}</h3>
				<input
					ref={progressBar}
					type="range"
					defaultValue="0"
					onChange={changeRange}
					max={duration.total}
				/>
				<h3>{duration.total || "00:00"}</h3>
			</RightContainer>
		</MainContainer>
	);
};

export default Player;
