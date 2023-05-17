import { useEffect, useRef, useState } from "react";

import { setAudioIsPlaying, setSong } from "@/store/root-slice";
import { useAppDispatch, useAppSelector, useEventListener } from ".";

// const player = new Audio();

const usePlayer = () => {
  const player = useRef(new Audio());
  const animationRef = useRef<number>(0);

  const { song, playlist, isPlaying } = useAppSelector(
    (state) => state.root.player
  );
  const dispatch = useAppDispatch();

  const [currentTime, setCurrentTime] = useState(player.current.currentTime);
  const [loop, setLoop] = useState(false);
  const [shuffle, setShuffle] = useState(false);

  useEffect(() => {
    if (song) {
      player.current.src = song.downloadUrl[2].link;
      player.current.play();

      dispatch(setAudioIsPlaying(true));
      animationRef.current = requestAnimationFrame(animate);
    }

    if (playlist) {
      dispatch(setSong(playlist[0]));
    }
  }, [song, playlist, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEventListener(
    "ended",
    () => {
      if (loop) {
        player.current.play();
      } else {
        dispatch(setAudioIsPlaying(false));
        cancelAnimationFrame(animationRef.current);
      }

      if (playlist) {
        if (shuffle) {
          const randomIndex = Math.floor(Math.random() * playlist.length);

          dispatch(setSong(playlist[randomIndex]));
        } else {
          const currentIndex = playlist.findIndex(
            (item) => item.id === song?.id
          );

          const nextIndex = currentIndex + 1;
          console.log(currentIndex, nextIndex);

          dispatch(setSong(playlist[nextIndex]));
        }
      }
    },
    player
  );

  /**
   * Toggle play/pause
   */
  const togglePlayPause = () => {
    if (isPlaying) {
      player.current.pause();
      dispatch(setAudioIsPlaying(false));
      cancelAnimationFrame(animationRef.current);
    } else {
      player.current.play();
      dispatch(setAudioIsPlaying(true));
      animationRef.current = requestAnimationFrame(animate);
    }
  };

  const animate = () => {
    setCurrentTime(player.current.currentTime);

    animationRef.current = requestAnimationFrame(animate);
  };

  /**
   * Handle time change
   * @param time Time in seconds
   */
  const handleTimeChange = (time: number) => {
    player.current.currentTime = time;
    setCurrentTime(time);
  };

  /**
   * Handle volume change
   * @param volume Volume in range [0, 1]
   */
  const handleVolume = (volume: number) => {
    player.current.volume = volume <= 1 ? volume : volume / 100;
  };

  /**
   * Handle loop change
   */
  const handleLoop = () => setLoop(!loop);

  /**
   * Handle shuffle change
   */
  const handleShuffle = () => setShuffle(!shuffle);

  return {
    player,
    currentTime,
    duration: player.current.duration || 0, // to avoid NaN
    isPlaying,
    togglePlayPause,
    handleTimeChange,
    handleVolume,
    loop,
    handleLoop,
    shuffle,
    handleShuffle,
  };
};

export default usePlayer;
