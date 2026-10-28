import { act } from "@testing-library/react-native";

import type { MenuEntry } from "~/components/native-menu";
import { renderWithProviders } from "~/test/render";
import { useFavoriteToggle } from "~/user-data/favorites";

import { DetailMenu, DetailMenuContext } from "./detail-menu";
import type { HeaderMenu } from "./detail-menu";

jest.mock("~/user-data/favorites", () => ({ useFavoriteToggle: jest.fn() }));
jest.mock("~/components/collection-menu", () => ({
  useCollectionEntries: ({ extra = [] }: { extra?: MenuEntry[] }) => extra,
}));

it("uses the current favorite action after favorites load without changing the label", async () => {
  const unavailable = jest.fn();
  const ready = jest.fn();
  jest
    .mocked(useFavoriteToggle)
    .mockReturnValue({ liked: false, toggle: unavailable });
  const register = jest.fn<void, [HeaderMenu | undefined]>();
  const ui = () => (
    <DetailMenuContext value={register}>
      <DetailMenu name="Podcast" like={{ type: "show", token: "show-id" }} />
    </DetailMenuContext>
  );
  const view = await renderWithProviders(ui());
  const menu = register.mock.calls.at(-1)?.[0];
  expect(menu?.entries[0]?.title).toBe("Like Podcast");

  jest
    .mocked(useFavoriteToggle)
    .mockReturnValue({ liked: false, toggle: ready });
  await view.rerender(ui());
  await act(async () => menu?.entries[0]?.run?.());

  expect(ready).toHaveBeenCalledTimes(1);
  expect(unavailable).not.toHaveBeenCalled();
});

it("uses refreshed actions inside a submenu whose labels stay the same", async () => {
  jest
    .mocked(useFavoriteToggle)
    .mockReturnValue({ liked: false, toggle: jest.fn() });
  const oldAction = jest.fn();
  const refreshedAction = jest.fn();
  const register = jest.fn<void, [HeaderMenu | undefined]>();
  const ui = (run: () => void) => (
    <DetailMenuContext value={register}>
      <DetailMenu
        name="Album"
        extra={[
          {
            id: "group",
            title: "Actions",
            subactions: [{ id: "action", title: "Open", run }],
          },
        ]}
      />
    </DetailMenuContext>
  );
  const view = await renderWithProviders(ui(oldAction));
  const menu = register.mock.calls.at(-1)?.[0];
  await view.rerender(ui(refreshedAction));
  await act(async () => menu?.entries[0]?.subactions?.[0]?.run?.());
  expect(refreshedAction).toHaveBeenCalledTimes(1);
  expect(oldAction).not.toHaveBeenCalled();
});
