"use client";

import type { Favorite, MyPlaylist } from "@infinitunes/db/schema";
import dynamic from "next/dynamic";

import type { User } from "~/lib/auth";

type PlayerWrapperProps = {
  user?: User;
  playlists?: MyPlaylist[];
  favorites?: Favorite | null;
};

const Player = dynamic(
  () => import("~/components/player").then((mod) => mod.Player),
  {
    ssr: false,
  },
);

export function PlayerWrapper({
  user,
  playlists,
  favorites,
}: PlayerWrapperProps) {
  return <Player user={user} playlists={playlists} favorites={favorites} />;
}
