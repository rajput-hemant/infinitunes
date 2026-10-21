import { newPlaylistSchema } from "@infinitunes/core/validations";
import {
  PLAYLIST_DESCRIPTION_MAX,
  PLAYLIST_NAME_MAX,
} from "@infinitunes/types";
import { useState } from "react";
import { TextInput, View } from "react-native";

import { ScreenScrollView } from "~/components/screen-scroll-view";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import type { PlaylistDetails } from "~/user-data/playlists";

type PlaylistFormProps = {
  initial?: { name: string; description: string | null };
  submitLabel: string;
  onSubmit: (details: PlaylistDetails) => void;
};

const INPUT_CLASS = "h-ctl-lg rounded-lg bg-fill px-4 text-foreground";

type FieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  maxLength: number;
  error?: string;
  onSubmitEditing?: () => void;
};

function Field({ label, placeholder, error, ...input }: FieldProps) {
  return (
    <View className="gap-1.5">
      <Text variant="subhead" tone="muted">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholder={placeholder}
        className={INPUT_CLASS}
        returnKeyType="done"
        {...input}
      />
      {error ? (
        <Text
          variant="caption"
          accessibilityRole="alert"
          className="text-destructive"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

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
    <ScreenScrollView
      contentContainerClassName="gap-4 px-page pt-4"
      keyboardShouldPersistTaps="handled"
    >
      <Field
        label="Name"
        placeholder="Enter playlist name"
        value={name}
        onChangeText={setName}
        maxLength={PLAYLIST_NAME_MAX}
        error={errorOf("name")}
        onSubmitEditing={submit}
      />
      <Field
        label="Description"
        placeholder="Enter playlist description"
        value={description}
        onChangeText={setDescription}
        maxLength={PLAYLIST_DESCRIPTION_MAX}
        error={errorOf("description")}
        onSubmitEditing={submit}
      />
      <Button label={submitLabel} onPress={submit} />
    </ScreenScrollView>
  );
}
