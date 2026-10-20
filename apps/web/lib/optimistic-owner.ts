"use client";

import { resetFavoriteOverlay } from "@infinitunes/core/react/optimistic-favorite";

import { resetPlaylistOverlay } from "~/lib/optimistic-playlists";

let owner: string | undefined;

/** Forgets every optimistic record (sign out, account switch). */
export function resetOptimisticState() {
  resetFavoriteOverlay();
  resetPlaylistOverlay();
}

/**
 * The overlays are per tab, not per account: call with the signed-in user id
 * and they are cleared when it changes, so one account's pending likes or
 * playlists never show for the next.
 */
export function claimOptimisticOwner(userId: string | undefined) {
  if (owner === userId) return;
  const first = owner === undefined && userId !== undefined;
  owner = userId;
  if (!first) resetOptimisticState();
}
