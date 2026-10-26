import type { FavoriteType } from "@infinitunes/core/favorites";
import { resetFavoriteOverlay } from "@infinitunes/core/react/optimistic-favorite";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";

import { FailureSnackbar } from "~/components/failure-snackbar";
import { confirm } from "~/lib/haptics";
import { renderStack } from "~/test/render";
import { signInAs } from "~/test/session-mock";
import { procedure, trpcError } from "~/test/trpc-mock";
import { deferred, favoritesRow } from "~/test/user-library";

import { useFavoriteLists, useFavoriteToggle } from "./favorites";
import { useOptimisticOwner } from "./session";

jest.mock("~/lib/haptics");

type HeartProps = { type?: FavoriteType; token?: string };

function Heart({ type = "song", token = "BSaNI3Yr" }: HeartProps) {
  useOptimisticOwner();
  const { liked, toggle } = useFavoriteToggle({ type, token });
  return (
    <Pressable accessibilityRole="button" onPress={toggle}>
      <Text testID="heart">{liked ? "liked" : "not liked"}</Text>
    </Pressable>
  );
}

function Lists() {
  const lists = useFavoriteLists();
  return (
    <Text testID="lists">
      {lists === undefined
        ? "unknown"
        : lists === null
          ? "failed"
          : lists.songs.join(",") || "empty"}
    </Text>
  );
}

const heart = () => screen.getByTestId("heart").props.children as string;
const add = () => procedure("user.addToFavorites");
const remove = () => procedure("user.removeFromFavorites");

async function renderHeart(props: HeartProps = {}) {
  const router = await renderStack({
    index: () => <Heart {...props} />,
    login: () => <Text>Login screen</Text>,
  });
  // A tap before the favorites row is known writes nothing; let it land
  // (the query cache notifies readers on a timer).
  await act(async () => {
    await jest.advanceTimersByTimeAsync(10);
  });
  return router;
}

beforeEach(async () => {
  // Each optimistic record expires on a long timer; a real one would keep
  // the Jest worker alive after the suite.
  jest.useFakeTimers();
  await act(async () => signInAs("alice"));
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  resetFavoriteOverlay();
});

describe("useFavoriteToggle", () => {
  it("flips the heart in the same frame, before the write lands", async () => {
    procedure("user.getUserFavorites").mockResolvedValue(favoritesRow());
    const write = deferred<never[]>();
    add().mockReturnValue(write.promise);
    await renderHeart();
    expect(heart()).toBe("not liked");

    await fireEvent.press(screen.getByRole("button"));

    expect(heart()).toBe("liked");
    expect(add()).toHaveBeenCalledWith({ type: "song", token: "BSaNI3Yr" });
    expect(confirm).toHaveBeenCalledTimes(1);

    await act(async () => write.resolve([]));
    expect(heart()).toBe("liked");
  });

  it("removes a like that the server holds", async () => {
    procedure("user.getUserFavorites").mockResolvedValue(
      favoritesRow({ songs: ["BSaNI3Yr"] }),
    );
    await renderHeart();
    await waitFor(() => expect(heart()).toBe("liked"));

    await fireEvent.press(screen.getByRole("button"));

    expect(heart()).toBe("not liked");
    expect(remove()).toHaveBeenCalledWith({ type: "song", token: "BSaNI3Yr" });
    expect(add()).not.toHaveBeenCalled();
  });

  it("rolls the heart back when the write fails", async () => {
    procedure("user.getUserFavorites").mockResolvedValue(favoritesRow());
    const write = deferred<never[]>();
    add().mockReturnValue(write.promise);
    await renderHeart();

    await fireEvent.press(screen.getByRole("button"));
    expect(heart()).toBe("liked");

    await act(async () => write.reject(trpcError("INTERNAL_SERVER_ERROR")));

    await waitFor(() => expect(heart()).toBe("not liked"));
  });

  it("says so in the failure snackbar when the write fails", async () => {
    procedure("user.getUserFavorites").mockResolvedValue(favoritesRow());
    add().mockRejectedValue(trpcError("INTERNAL_SERVER_ERROR"));
    await renderStack({
      index: () => (
        <>
          <Heart />
          <FailureSnackbar />
        </>
      ),
    });
    await act(async () => {
      await jest.advanceTimersByTimeAsync(10);
    });

    await fireEvent.press(screen.getByRole("button"));

    expect(
      await screen.findByRole("alert", {
        name: "Couldn't update your likes. Try again.",
      }),
    ).toBeOnTheScreen();
    expect(heart()).toBe("not liked");
  });

  it("sends the latest intent after rapid taps, one write at a time", async () => {
    procedure("user.getUserFavorites").mockResolvedValue(favoritesRow());
    const first = deferred<never[]>();
    add().mockReturnValueOnce(first.promise);
    await renderHeart();

    await fireEvent.press(screen.getByRole("button"));
    await fireEvent.press(screen.getByRole("button"));
    expect(heart()).toBe("not liked");
    // The like is still in flight: the unlike waits for it.
    expect(add()).toHaveBeenCalledTimes(1);
    expect(remove()).not.toHaveBeenCalled();

    await act(async () => first.resolve([]));

    await waitFor(() => expect(remove()).toHaveBeenCalledTimes(1));
    expect(heart()).toBe("not liked");
  });

  it("sends a signed-out listener to sign in", async () => {
    await act(async () => signInAs(null));
    const router = await renderHeart({ type: "album", token: "LHgqn" });

    await fireEvent.press(screen.getByRole("button"));

    expect(add()).not.toHaveBeenCalled();
    expect(router.getPathname()).toBe("/login");
  });

  it("writes nothing while the liked state is unknown", async () => {
    procedure("user.getUserFavorites").mockRejectedValue(new Error("down"));
    await renderHeart();

    await fireEvent.press(screen.getByRole("button"));

    expect(add()).not.toHaveBeenCalled();
    expect(remove()).not.toHaveBeenCalled();
    expect(heart()).toBe("not liked");
  });

  it("clears one account's pending like when another signs in", async () => {
    procedure("user.getUserFavorites").mockResolvedValue(favoritesRow());
    add().mockReturnValue(deferred<never[]>().promise);
    await renderHeart();
    await fireEvent.press(screen.getByRole("button"));
    expect(heart()).toBe("liked");

    await act(async () => signInAs("bob"));

    await waitFor(() => expect(heart()).toBe("not liked"));
  });

  it("does not re-render another item's heart when one is liked", async () => {
    procedure("user.getUserFavorites").mockResolvedValue(favoritesRow());
    const rendered = jest.fn();
    function Other() {
      rendered();
      const { liked } = useFavoriteToggle({ type: "song", token: "other" });
      return <Text>{liked ? "other liked" : "other not liked"}</Text>;
    }
    await renderStack({
      index: () => (
        <>
          <Heart />
          <Other />
        </>
      ),
    });
    await act(async () => {
      await jest.advanceTimersByTimeAsync(10);
    });
    const before = rendered.mock.calls.length;

    procedure("user.getUserFavorites").mockResolvedValue(
      favoritesRow({ songs: ["BSaNI3Yr"] }),
    );
    await fireEvent.press(screen.getByRole("button"));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(10);
    });

    expect(heart()).toBe("liked");
    expect(procedure("user.getUserFavorites")).toHaveBeenCalledTimes(2);
    expect(rendered).toHaveBeenCalledTimes(before);
  });

  it("does not send Alice's queued unlike after Bob signs in", async () => {
    procedure("user.getUserFavorites").mockResolvedValue(favoritesRow());
    const first = deferred<never[]>();
    add().mockReturnValueOnce(first.promise);
    await renderHeart();
    await fireEvent.press(screen.getByRole("button"));
    await fireEvent.press(screen.getByRole("button"));
    expect(remove()).not.toHaveBeenCalled();

    await act(async () => signInAs("bob"));
    await act(async () => first.resolve([]));

    expect(remove()).not.toHaveBeenCalled();
  });
});

async function renderLists() {
  await renderStack({ index: () => <Lists /> });
}
const lists = () => screen.getByTestId("lists").props.children as string;

describe("useFavoriteLists", () => {
  it("is unknown while signed out, without asking the server", async () => {
    await act(async () => signInAs(null));
    await renderLists();
    await act(async () => {});

    expect(lists()).toBe("unknown");
    expect(procedure("user.getUserFavorites")).not.toHaveBeenCalled();
  });

  it("is empty, not unknown, for a listener who never liked anything", async () => {
    procedure("user.getUserFavorites").mockResolvedValue(null);
    await renderLists();

    await waitFor(() => expect(lists()).toBe("empty"));
  });

  it("is the liked tokens of the signed-in listener", async () => {
    procedure("user.getUserFavorites").mockResolvedValue(
      favoritesRow({ songs: ["a", "b"] }),
    );
    await renderLists();

    await waitFor(() => expect(lists()).toBe("a,b"));
  });

  it("is failed when the read fails, so nothing is written over it", async () => {
    procedure("user.getUserFavorites").mockRejectedValue(new Error("down"));
    await renderLists();

    await waitFor(() => expect(lists()).toBe("failed"));
  });
});
