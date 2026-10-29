import { expect, it } from "bun:test";

import { act } from "react";
import { createRoot } from "react-dom/client";

import {
  useActiveRadioSession,
  useCurrentSongIndex,
  useIsPlayerInit,
  useSetActiveRadioSession,
  useSetCurrentSongIndex,
  useSetIsPlayerInit,
} from "../../hooks/use-store";

it("writes playback state without subscribing action-only controls to it", async () => {
  let renders = 0;
  function Actions() {
    renders++;
    const setIndex = useSetCurrentSongIndex();
    const setInit = useSetIsPlayerInit();
    const setRadio = useSetActiveRadioSession();
    return (
      <button
        onClick={() => {
          setIndex(3);
          setInit(true);
          setRadio({
            stationId: "station",
            name: "Radio",
            type: "featured",
            language: "english",
          });
        }}
      >
        Play
      </button>
    );
  }
  function State() {
    const [index] = useCurrentSongIndex();
    const [init] = useIsPlayerInit();
    const [radio] = useActiveRadioSession();
    return <output>{`${index} ${init} ${radio?.name}`}</output>;
  }
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () =>
      root.render(
        <>
          <Actions />
          <State />
        </>,
      ),
    );
    const before = renders;
    await act(async () => host.querySelector("button")?.click());
    expect(host.querySelector("output")?.textContent).toBe("3 true Radio");
    expect(renders).toBe(before);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    localStorage.clear();
  }
});
