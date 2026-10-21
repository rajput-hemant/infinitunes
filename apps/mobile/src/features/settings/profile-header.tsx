import { Column, Row, Spacer, Text } from "@expo/ui";
import { useColorScheme } from "react-native";

import { colors } from "~/theme/tokens";

const AVATAR_SIZE = 48;

type ProfileUser = { name?: string | null; email: string };

/** The avatar's letter: the name's first, else the email's (the web's `userInitial`). */
export function userInitial({ name, email }: ProfileUser): string {
  return (name?.trim() || email.trim()).charAt(0).toUpperCase();
}

/**
 * The signed-in account at the top of Settings (the web's user menu header):
 * the initial in a filled circle, the name and the email. Display only; the
 * "Edit profile" row under it opens the form.
 */
export function ProfileHeader({ user }: { user: ProfileUser }) {
  const palette = colors[useColorScheme() === "dark" ? "dark" : "light"];
  const name = user.name?.trim();

  return (
    <Row spacing={12} alignment="center" testID="profile">
      <Column
        alignment="center"
        style={{
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          borderRadius: AVATAR_SIZE / 2,
          backgroundColor: palette.primary,
        }}
      >
        <Spacer flexible />
        <Text
          textStyle={{
            fontSize: 20,
            fontWeight: "bold",
            color: palette["primary-foreground"],
            textAlign: "center",
          }}
        >
          {userInitial(user)}
        </Text>
        <Spacer flexible />
      </Column>
      <Column spacing={2}>
        <Text textStyle={{ fontSize: 17, fontWeight: "600" }} numberOfLines={1}>
          {name || user.email}
        </Text>
        {name ? (
          <Text
            textStyle={{ color: palette["muted-foreground"] }}
            numberOfLines={1}
          >
            {user.email}
          </Text>
        ) : null}
      </Column>
    </Row>
  );
}
