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
  const [currentIndex, setCurrentIndex] = useState(0); // index of current song in playlist
  const [loop, setLoop] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [mute, setMute] = useState(false);

  useEffect(() => {
    if (song) {
      player.current.src = song.downloadUrl[2].link;
      player.current.play();

      dispatch(setAudioIsPlaying(true));
      animationRef.current = requestAnimationFrame(animate);
    }

    if (playlist) {
      dispatch(setSong(playlist[currentIndex]));
    }
  }, [song, playlist, currentIndex, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    player.current.onplay = () => {
      dispatch(setAudioIsPlaying(true));
      animationRef.current = requestAnimationFrame(animate);
    };

    player.current.onpause = () => {
      dispatch(setAudioIsPlaying(false));
      cancelAnimationFrame(animationRef.current);
    };
  }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEventListener(
    "ended",
    () => {
      if (loop) {
        player.current.play();
      }

      if (playlist) {
        if (shuffle) {
          setCurrentIndex(getRandomIndex());

          dispatch(setSong(playlist[currentIndex]));
        } else {
          const currentIndex = getCurrentIndex();

          currentIndex !== playlist.length - 1 &&
            setCurrentIndex(currentIndex + 1);

          dispatch(setSong(playlist[currentIndex]));
        }
      }
    },
    player
  );

  /**
   * Toggle play/pause
   */
  const togglePlayPause = () => {
    if (song) {
      isPlaying ? player.current.pause() : player.current.play();
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
   * Handle mute
   */
  const handleMute = () => {
    setMute(!mute);
    player.current.muted = !mute;
  };

  /**
   * Handle loop change
   */
  const handleLoop = () => setLoop(!loop);

  /**
   * Handle shuffle change
   */
  const handleShuffle = () => setShuffle(!shuffle);

  /**
   * Get Random Index of Playlist
   */
  const getRandomIndex = () => {
    if (!playlist) {
      return 0;
    }

    const randomIndex = Math.floor(Math.random() * playlist.length);

    return randomIndex;
  };

  /**
   * Get current song index
   */
  const getCurrentIndex = () => {
    if (!playlist) {
      return 0;
    }

    const currentIndex = playlist.findIndex((item) => item.id === song?.id);

    return currentIndex;
  };

  /**
   * Handle previous song
   */
  const handlePrevious = () => {
    if (playlist) {
      if (shuffle) {
        setCurrentIndex(getRandomIndex());

        dispatch(setSong(playlist[currentIndex]));
      } else {
        const currentIndex = getCurrentIndex();

        currentIndex !== 0 && setCurrentIndex(currentIndex - 1);

        dispatch(setSong(playlist[currentIndex]));
      }
    }
  };

  /**
   * Handle next song
   */
  const handleNext = () => {
    if (playlist) {
      if (shuffle) {
        setCurrentIndex(getRandomIndex());

        dispatch(setSong(playlist[currentIndex]));
      } else {
        const currentIndex = getCurrentIndex();

        currentIndex !== playlist.length - 1 &&
          setCurrentIndex(currentIndex + 1);

        dispatch(setSong(playlist[currentIndex]));
      }
    }
  };

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
    mute,
    handleMute,
    handleNext,
    handlePrevious,
  };
};

export default usePlayer;
