"use client";

import {
  usePlaylistGone,
  usePlaylistMeta,
  usePlaylistRowRemoved,
  useUnconfirmedPlaylists,
} from "@infinitunes/core/react/optimistic-playlists";
import { Skeleton } from "@infinitunes/ui/components/skeleton";
import { ListMusic } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { asRoute, cn } from "~/lib/utils";

/** Hides its children as soon as the playlist is deleted, before the refresh lands. */
export function PlaylistGate({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return usePlaylistGone(id) ? null : children;
}

type PlaylistIdentity = {
  id: string;
  name: string;
  description: string | null;
};

/** The playlist page title, with the name a rename just set. */
export function PlaylistTitle({
  className,
  ...playlist
}: PlaylistIdentity & { className?: string }) {
  const { name } = usePlaylistMeta(playlist);

  return (
    <h1 title={name} className={className}>
      {name}
    </h1>
  );
}

/** The playlist page description, with the one a rename just set. */
export function PlaylistDescription(playlist: PlaylistIdentity) {
  const { description } = usePlaylistMeta(playlist);

  return description ? <p className="max-w-xl">{description}</p> : null;
}

/** Name and subtitle under a playlist card, with a pending rename applied. */
export function PlaylistCaption({
  songCount,
  ...playlist
}: PlaylistIdentity & { songCount: number }) {
  const { name, description } = usePlaylistMeta(playlist);

  return (
    <div className="mt-2 min-w-0">
      <h3 className="truncate text-[0.8125rem] leading-5 font-semibold">
        {name}
      </h3>

      <span className="block truncate text-xs leading-4 text-muted-foreground">
        {description || `${songCount} ${songCount === 1 ? "song" : "songs"}`}
      </span>
    </div>
  );
}

/**
 * A `<li>` for one row of a playlist page; hidden the moment its song is
 * removed, so the list closes up before the write has finished.
 */
export function PlaylistRow({
  playlistId,
  songId,
  className,
  children,
}: {
  playlistId: string;
  songId: string;
  className?: string;
  children: ReactNode;
}) {
  const removed = usePlaylistRowRemoved(playlistId, songId);

  return (
    <li hidden={removed} className={className}>
      {children}
    </li>
  );
}

/**
 * Cards for playlists created this session that the grid does not list yet.
 * Until the database has minted the id the card is dimmed and has no link.
 */
export function PendingPlaylistCards({ serverIds }: { serverIds: string[] }) {
  const unconfirmed = useUnconfirmedPlaylists(serverIds);

  return unconfirmed.map((playlist) => {
    const href = playlist.real
      ? asRoute(`/me/playlist/${playlist.real.id}`)
      : undefined;
    const body = (
      <>
        <div className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-md bg-fill text-muted-foreground shadow-sm">
          <ListMusic aria-hidden className="size-8" />
          <Skeleton className="absolute inset-0 -z-10 size-full" />
        </div>
        <div className="mt-2 min-w-0">
          <h3 className="truncate text-[0.8125rem] leading-5 font-semibold">
            {playlist.name}
          </h3>
          <span className="block truncate text-xs leading-4 text-muted-foreground">
            {playlist.real ? "0 songs" : "Creating..."}
          </span>
        </div>
      </>
    );

    return href ? (
      <Link
        key={playlist.tempId}
        href={href}
        className="group w-32 shrink-0 p-2 sm:w-36 md:w-48 lg:w-56"
      >
        {body}
      </Link>
    ) : (
      <div
        key={playlist.tempId}
        aria-busy
        className={cn(
          "w-32 shrink-0 p-2 opacity-60 sm:w-36 md:w-48 lg:w-56",
          "cursor-progress",
        )}
      >
        {body}
      </div>
    );
  });
}
