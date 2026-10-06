import { USER_NAME_MAX } from "@infinitunes/auth/schemas";
import {
  PLAYLIST_DESCRIPTION_MAX,
  PLAYLIST_NAME_MAX,
} from "@infinitunes/types";
import * as z from "zod";

export const nameSchema = z
  .string()
  .trim()
  .min(1, { error: "Name is Required" })
  .max(USER_NAME_MAX, {
    error: `Name must be at most ${USER_NAME_MAX} characters long`,
  });

export const newPlaylistSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long" })
    .max(PLAYLIST_NAME_MAX, {
      message: `Name must be at most ${PLAYLIST_NAME_MAX} characters long`,
    }),
  description: z
    .string()
    .max(PLAYLIST_DESCRIPTION_MAX, {
      message: `Description must be at most ${PLAYLIST_DESCRIPTION_MAX} characters long`,
    })
    .optional(),
});
