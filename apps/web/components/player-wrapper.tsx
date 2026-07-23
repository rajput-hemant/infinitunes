"use client";

import type { MyPlaylist } from "@infinitunes/db/schema";
import type { User } from "@infinitunes/types";
import dynamic from "next/dynamic";

type PlayerWrapperProps = {
  user?: User;
  playlists?: MyPlaylist[];
};

const Player = dynamic(
  () => import("~/components/player").then((mod) => mod.Player),
  {
    ssr: false,
  },
);

export function PlayerWrapper({ user, playlists }: PlayerWrapperProps) {
  return <Player user={user} playlists={playlists} />;
}

export default PlayerWrapper;
