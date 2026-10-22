import { act, fireEvent, screen } from "@testing-library/react-native";

import { renderWithProviders } from "~/test/render";

import { CardPlayButton } from "./card-play-button";

const mockPlayEntity = jest.fn();
jest.mock("~/playback/play-entity", () => ({
  playEntity: (...args: unknown[]) => mockPlayEntity(...args),
}));

const URL = "https://www.jiosaavn.com/album/udta-teer/LHgqn,SRpyA_";

function renderButton() {
  return renderWithProviders(
    <CardPlayButton type="album" url={URL} name="Udta Teer" />,
  );
}

beforeEach(() => mockPlayEntity.mockReset());

describe("CardPlayButton", () => {
  it("reads 'Play <name>' and starts the item without opening it", async () => {
    mockPlayEntity.mockResolvedValue(undefined);
    await renderButton();

    await fireEvent.press(
      screen.getByRole("button", { name: "Play Udta Teer" }),
    );

    expect(mockPlayEntity).toHaveBeenCalledWith("album", URL);
  });

  it("is busy while the request runs and ignores a second press", async () => {
    let finish!: () => void;
    mockPlayEntity.mockReturnValue(new Promise<void>((r) => (finish = r)));
    await renderButton();
    const button = () => screen.getByRole("button", { name: "Play Udta Teer" });
    expect(button()).toHaveProp("accessibilityState", {
      selected: undefined,
      disabled: false,
      busy: false,
    });

    await fireEvent.press(button());
    expect(button().props.accessibilityState.busy).toBe(true);
    await fireEvent.press(button());
    expect(mockPlayEntity).toHaveBeenCalledTimes(1);

    await act(async () => finish());
    expect(button().props.accessibilityState.busy).toBe(false);
  });
});
