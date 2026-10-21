import { newPlaylistSchema } from "@infinitunes/core/validations";
import {
  PLAYLIST_DESCRIPTION_MAX,
  PLAYLIST_NAME_MAX,
} from "@infinitunes/types";
import { useState } from "react";

import { FormField } from "~/components/form/form-field";
import { FormScreen } from "~/components/form/form-screen";
import { Button } from "~/components/ui/button";
import type { PlaylistDetails } from "~/user-data/playlists";

type PlaylistFormProps = {
  initial?: { name: string; description: string | null };
  submitLabel: string;
  onSubmit: (details: PlaylistDetails) => void;
};

/**
 * Name and description of a playlist, checked with the same rules as the
 * server. The caller closes the form: the write is optimistic, so there is
 * nothing to wait for.
 */
export function PlaylistForm({
  initial,
  submitLabel,
  onSubmit,
}: PlaylistFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [submitted, setSubmitted] = useState(false);

  const parsed = newPlaylistSchema.safeParse({
    name: name.trim(),
    description: description.trim() || undefined,
  });
  const errorOf = (field: "name" | "description") =>
    submitted && !parsed.success
      ? parsed.error.issues.find((issue) => issue.path[0] === field)?.message
      : undefined;

  function submit() {
    setSubmitted(true);
    if (parsed.success) onSubmit(parsed.data);
  }

  return (
    <FormScreen>
      <FormField
        label="Name"
        placeholder="Enter playlist name"
        value={name}
        onChangeText={setName}
        maxLength={PLAYLIST_NAME_MAX}
        error={errorOf("name")}
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      <FormField
        label="Description"
        placeholder="Enter playlist description"
        value={description}
        onChangeText={setDescription}
        maxLength={PLAYLIST_DESCRIPTION_MAX}
        error={errorOf("description")}
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      <Button label={submitLabel} onPress={submit} />
    </FormScreen>
  );
}
