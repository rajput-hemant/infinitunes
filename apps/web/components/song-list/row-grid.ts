/**
 * Column grid shared by song rows and the table head. Phone is two columns
 * (title, actions). From md the number, time and actions columns appear.
 * Compact density adds artist then album columns as the list's own width
 * (a container query, not the viewport) allows, so a narrow results column
 * sheds them first.
 */
export const songRowGrid = [
  "grid items-center gap-3",
  "grid-cols-[minmax(0,1fr)_auto]",
  "md:grid-cols-[2.25rem_minmax(0,1fr)_3.5rem_8rem]",
  "[[data-density=compact]_&]:md:@min-[30rem]:grid-cols-[2.25rem_minmax(0,3fr)_minmax(0,2fr)_3.5rem_8rem]",
  "[[data-density=compact]_&]:md:@min-[45rem]:grid-cols-[2.25rem_minmax(0,3fr)_minmax(0,2fr)_minmax(0,2fr)_3.5rem_8rem]",
].join(" ");

export const artistCellVisibility =
  "hidden [[data-density=compact]_&]:md:@min-[30rem]:block";

export const albumCellVisibility =
  "hidden [[data-density=compact]_&]:md:@min-[45rem]:block";

/** Row actions appear on row hover or focus; touch screens (no hover) always show them. */
export const rowActionReveal =
  "[@media(hover:hover)]:md:opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100 focus-visible:opacity-100";

/** Second line under the title, dropped once the artist has its own column. */
export const subtitleVisibility =
  "[[data-density=compact]_&]:md:@min-[30rem]:hidden";
