import { act, waitFor } from "@testing-library/react-native";

import { renderWithProviders } from "~/test/render";
import { signInAs } from "~/test/session-mock";
import { procedure } from "~/test/trpc-mock";
import { userPlaylist } from "~/test/user-library";

import { AssistantPlaylists } from "./assistant-playlists";
import { shareAssistantPlaylists } from "./assistant-shortcuts";

// The iOS writer goes through React Native's native `Settings` module.
jest.mock("./assistant-shortcuts", () => ({
  shareAssistantPlaylists: jest.fn(),
}));

const shared = jest.mocked(shareAssistantPlaylists);

describe("AssistantPlaylists", () => {
  it("shares the signed-in listener's playlist names and ids", async () => {
    await act(async () => signInAs("alice"));
    procedure("user.getUserPlaylists").mockResolvedValue([
      userPlaylist({ id: "pl-1", name: "Road Trip", songs: ["a"] }),
      userPlaylist({ id: "pl-2", name: "Focus" }),
    ]);

    renderWithProviders(<AssistantPlaylists />);

    await waitFor(() =>
      expect(shared).toHaveBeenLastCalledWith([
        { id: "pl-1", name: "Road Trip" },
        { id: "pl-2", name: "Focus" },
      ]),
    );
  });

  it("clears them when signed out", async () => {
    renderWithProviders(<AssistantPlaylists />);

    await waitFor(() => expect(shared).toHaveBeenLastCalledWith(null));
    expect(procedure("user.getUserPlaylists")).not.toHaveBeenCalled();
  });

  it("clears them on sign-out", async () => {
    await act(async () => signInAs("alice"));
    procedure("user.getUserPlaylists").mockResolvedValue([userPlaylist()]);
    renderWithProviders(<AssistantPlaylists />);
    await waitFor(() => expect(shared).toHaveBeenCalled());

    await act(async () => signInAs(null));

    expect(shared).toHaveBeenLastCalledWith(null);
  });

  it("clears the previous account's while the next one's load", async () => {
    await act(async () => signInAs("alice"));
    procedure("user.getUserPlaylists").mockResolvedValue([
      userPlaylist({ id: "pl-1", name: "Road Trip" }),
    ]);
    renderWithProviders(<AssistantPlaylists />);
    await waitFor(() =>
      expect(shared).toHaveBeenLastCalledWith([
        { id: "pl-1", name: "Road Trip" },
      ]),
    );

    procedure("user.getUserPlaylists").mockReturnValue(new Promise(() => {}));
    await act(async () => signInAs("bob"));

    expect(shared).toHaveBeenLastCalledWith(null);
  });
});
