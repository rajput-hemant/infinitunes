"use client";

import type { MyPlaylist } from "@infinitunes/db/schema";
import dynamic from "next/dynamic";

import type { User } from "@/types/user";

const Player = dynamic(() => import("@/components/player"), { ssr: false });

type PlayerWrapperProps = {
  user?: User;
  playlists?: MyPlaylist[];
};

export function PlayerWrapper({ user, playlists }: PlayerWrapperProps) {
  return <Player user={user} playlists={playlists} />;
}
