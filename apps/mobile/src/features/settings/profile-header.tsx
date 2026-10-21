import { Column, Row, Spacer, Text } from "@expo/ui";

import { userInitial } from "~/lib/user-initial";
import type { InitialUser } from "~/lib/user-initial";
import { art, space, textStyles } from "~/theme/tokens";
import { usePalette } from "~/theme/use-palette";

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
export function ProfileHeader({ user }: { user: InitialUser }) {
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
