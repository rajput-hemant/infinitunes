"use client";

import type { MyPlaylist } from "@infinitunes/db/schema";
import dynamic from "next/dynamic";

import type { User } from "~/types/user";

type PlayerWrapperProps = {
  user?: User;
  playlists?: MyPlaylist[];
};

const Player = dynamic(() => import("~/components/player"), {
  ssr: false,
});

export function PlayerWrapper({ user, playlists }: PlayerWrapperProps) {
  return <Player user={user} playlists={playlists} />;
}

export default PlayerWrapper;
