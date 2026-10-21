import { PLAYLIST_DESCRIPTION_MAX } from "@infinitunes/types";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { router as appRouter } from "expo-router";
import type { Href } from "expo-router";

import { renderStack } from "~/test/render";
import { signInAs } from "~/test/session-mock";
import { procedure } from "~/test/trpc-mock";
import { userPlaylist } from "~/test/user-library";

import { EditPlaylistScreen } from "./edit-playlist-screen";
import { NewPlaylistScreen } from "./new-playlist-screen";

/** Opens the screen on top of `/`, as the app does, so closing it has somewhere to go. */
async function open(routes: Parameters<typeof renderStack>[0], path: Href) {
  const router = await renderStack({
    index: () => null,
    login: () => null,
    ...routes,
  });
  await act(async () => appRouter.push(path));
  return router;
}

const renderEdit = (id: string) =>
  open(
    { "me/edit-playlist/[id]": EditPlaylistScreen },
    { pathname: "/me/edit-playlist/[id]", params: { id } },
  );

const renderNew = () =>
  open({ "me/new-playlist": NewPlaylistScreen }, "/me/new-playlist");

beforeEach(async () => {
  await act(async () => signInAs("alice"));
});

describe("EditPlaylistScreen", () => {
  it("says so, with a way out, when the playlist is gone", async () => {
    procedure("user.getUserPlaylists").mockResolvedValue([
      userPlaylist({ id: "pl-1" }),
    ]);
    const router = await renderEdit("pl-gone");

    expect(await screen.findByText("Playlist not found")).toBeOnTheScreen();
    expect(router.getPathname()).toBe("/me/edit-playlist/pl-gone");
    await fireEvent.press(screen.getByRole("button", { name: "Close" }));

    expect(router.getPathname()).toBe("/");
  });

  it("shows a skeleton while the playlists load", async () => {
    procedure("user.getUserPlaylists").mockReturnValue(new Promise(() => {}));
    await renderEdit("pl-1");

    expect(await screen.findByLabelText("Loading")).toBeOnTheScreen();
  });

  it("offers a retry when the playlists cannot load, then shows the form", async () => {
    procedure("user.getUserPlaylists")
      .mockRejectedValueOnce(new Error("down"))
      .mockResolvedValue([userPlaylist({ id: "pl-1", name: "Road Trip" })]);
    await renderEdit("pl-1");

    await fireEvent.press(
      await screen.findByRole("button", { name: "Try again" }),
    );

    expect((await screen.findByLabelText("Name")).props.value).toBe(
      "Road Trip",
    );
  });

  it("starts the form from the playlist's name and description", async () => {
    procedure("user.getUserPlaylists").mockResolvedValue([
      userPlaylist({ id: "pl-1", name: "Road Trip", description: "Summer" }),
    ]);
    await renderEdit("pl-1");

    expect((await screen.findByLabelText("Name")).props.value).toBe(
      "Road Trip",
    );
    expect(screen.getByLabelText("Description").props.value).toBe("Summer");
    expect(screen.getByRole("button", { name: "Save" })).toBeOnTheScreen();
  });

  it("asks a signed-out listener to sign in instead", async () => {
    await act(async () => signInAs(null));
    await renderEdit("pl-1");

    expect(
      await screen.findByText("Your library lives in your account"),
    ).toBeOnTheScreen();
    expect(screen.queryByLabelText("Name")).toBeNull();
  });
});

describe("the playlist form", () => {
  it("shows no message before the first submit, then one per bad field", async () => {
    await renderNew();
    await fireEvent.changeText(screen.getByLabelText("Name"), "ab");
    await fireEvent.changeText(
      screen.getByLabelText("Description"),
      "d".repeat(PLAYLIST_DESCRIPTION_MAX + 1),
    );
    expect(screen.queryByRole("alert")).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "Create" }));

    expect(
      screen.getByText("Name must be at least 3 characters long"),
    ).toBeOnTheScreen();
    expect(
      screen.getByText(
        `Description must be at most ${PLAYLIST_DESCRIPTION_MAX} characters long`,
      ),
    ).toBeOnTheScreen();
    expect(procedure("user.createNewPlaylist")).not.toHaveBeenCalled();
  });

  it("clears a message as soon as the field is fixed", async () => {
    await renderNew();
    await fireEvent.press(screen.getByRole("button", { name: "Create" }));
    expect(
      screen.getByText("Name must be at least 3 characters long"),
    ).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText("Name"), "Road Trip");

    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("sends the trimmed name, and no description when it is blank", async () => {
    const router = await renderNew();
    await fireEvent.changeText(screen.getByLabelText("Name"), "  Road Trip  ");
    await fireEvent.changeText(screen.getByLabelText("Description"), "   ");

    await fireEvent.press(screen.getByRole("button", { name: "Create" }));

    expect(procedure("user.createNewPlaylist")).toHaveBeenCalledTimes(1);
    const [input] = procedure("user.createNewPlaylist").mock.calls[0] ?? [];
    expect(input).toEqual({ name: "Road Trip" });
    expect(input).not.toHaveProperty("description", "");
    expect(router.getPathname()).toBe("/");
  });

  it("submits from the keyboard's Done key", async () => {
    await renderNew();
    await fireEvent.changeText(screen.getByLabelText("Name"), "Road Trip");

    await fireEvent(screen.getByLabelText("Name"), "submitEditing");

    expect(procedure("user.createNewPlaylist")).toHaveBeenCalledTimes(1);
  });
});
