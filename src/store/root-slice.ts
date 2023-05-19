import { PayloadAction, createSlice } from "@reduxjs/toolkit";

import { Album, Artist, ImageQuality, Modules, Playlist } from "@/types";

// import { SongQuality } from "@/lib/utils";

enum SongQuality {
  poor = "_12",
  low = "_48",
  medium = "_96",

  high = "_160",
  best = "_256",
  lossless = "_320",
}

type InitialState = {
  homeData: Modules | null;
  albums: Album[] | null;
  artists: Artist[] | null;
  playlists: Playlist[] | null;
  preferences: {
    songStreamingQuality: SongQuality;
    downloadQuality: SongQuality;
    imageQuality: ImageQuality;
  };
};

const initialState: InitialState = {
  homeData: null,
  albums: null,
  artists: null,
  playlists: null,
  preferences: {
    songStreamingQuality:
      (localStorage.getItem("songQuality") as SongQuality | null) ??
      SongQuality.best,
    downloadQuality:
      (localStorage.getItem("downloadQuality") as SongQuality | null) ??
      SongQuality.best,
    imageQuality:
      (localStorage.getItem("imageQuality") as ImageQuality | null) ?? "medium",
  },
};

const RootSlice = createSlice({
  name: "root",

  initialState,

  reducers: {
    /** Set home data*/
    setHomeData: (state, action: PayloadAction<Modules>) => {
      state.homeData = action.payload;
    },

    /** Set albums */
    setAlbums: (state, action: PayloadAction<Album[]>) => {
      // console.log(state.albums);

      const newAlbums = action.payload.filter((album) => {
        // Check if the album is already present in the state
        return !state.albums?.some(
          (existingAlbum) => existingAlbum.id === album.id
        );
      });

      // Add the new albums to the state
      state.albums = [...(state.albums ?? []), ...newAlbums];
      // console.log(state.albums);
    },

    /** Set artists */
    setArtists: (state, action: PayloadAction<Artist[]>) => {
      const newArtists = action.payload.filter((artist) => {
        // Check if the artist is already present in the state
        return !state.artists?.some(
          (existingArtist) => existingArtist.id === artist.id
        );
      });

      // Add the new artists to the state
      state.artists = [...(state.artists ?? []), ...newArtists];
    },

    /** Set playlists */
    setPlaylists: (state, action: PayloadAction<Playlist[]>) => {
      const newPlaylists = action.payload.filter((playlist) => {
        // Check if the playlist is already present in the state
        return !state.playlists?.some(
          (existingPlaylist) => existingPlaylist.id === playlist.id
        );
      });

      // Add the new playlists to the state
      state.playlists = [...(state.playlists ?? []), ...newPlaylists];
    },

    /** Set song streaming quality */
    setSongStreamingQuality: (state, action: PayloadAction<SongQuality>) => {
      state.preferences.songStreamingQuality = action.payload;
    },

    /** Set download quality */
    setDownloadQuality: (state, action: PayloadAction<SongQuality>) => {
      state.preferences.downloadQuality = action.payload;
    },

    /** Set image quality */
    setImageQuality: (state, action: PayloadAction<ImageQuality>) => {
      state.preferences.imageQuality = action.payload;
    },
  },
});

export const {
  setHomeData,
  setAlbums,
  setArtists,
  setPlaylists,
  setSongStreamingQuality,
  setDownloadQuality,
  setImageQuality,
} = RootSlice.actions;

export default RootSlice.reducer;
