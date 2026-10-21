import { Column, Row, Spacer, Text } from "@expo/ui";

import { art, space, textStyles } from "~/theme/tokens";
import { usePalette } from "~/theme/use-palette";

type ProfileUser = { name?: string | null; email: string };

/** The avatar's letter: the name's first, else the email's (the web's `userInitial`). */
export function userInitial({ name, email }: ProfileUser): string {
  return (name?.trim() || email.trim()).charAt(0).toUpperCase();
}

const AVATAR = {
  width: art.avatar,
  height: art.avatar,
  borderRadius: art.avatar / 2,
};

/**
 * The signed-in account at the top of Settings (the web's user menu header):
 * the initial in a filled circle, the name and the email. Display only; the
 * "Edit profile" row under it opens the form.
 */
export function ProfileHeader({ user }: { user: ProfileUser }) {
  const palette = usePalette();
  const name = user.name?.trim();

  return (
    <Row spacing={space.md} alignment="center" testID="profile">
      <Column
        alignment="center"
        style={{ ...AVATAR, backgroundColor: palette.primary }}
      >
        <Spacer flexible />
        <Text
          textStyle={{
            ...textStyles.title2,
            color: palette["primary-foreground"],
            textAlign: "center",
          }}
        >
          {userInitial(user)}
        </Text>
        <Spacer flexible />
      </Column>
      {/* A title over a subtitle: their line heights space them. */}
      <Column>
        <Text textStyle={textStyles.headline} numberOfLines={1}>
          {name || user.email}
        </Text>
        {name ? (
          <Text
            textStyle={{
              ...textStyles.subhead,
              color: palette["muted-foreground"],
            }}
            numberOfLines={1}
          >
            {user.email}
          </Text>
        ) : null}
      </Column>
    </Row>
  );
}
