import { describe, expect, test } from "bun:test";

import {
  project,
  rubber,
  spring,
  springSettled,
  springStep,
} from "~/lib/glass/spring";
import type { Scheduler } from "~/lib/glass/spring";

function run(damping: number, to = 1) {
  let state = { x: 0, v: 0 };
  let peak = 0;
  let steps = 0;
  while (!springSettled(state, to * 100) && steps < 2000) {
    state = springStep(state, to * 100, 0.3, damping, 1 / 60);
    peak = Math.max(peak, state.x);
    steps++;
  }
  return { state, peak, steps };
}

describe("springStep", () => {
  test("a critically damped spring settles on target without overshoot", () => {
    const { peak, steps } = run(1);
    expect(peak).toBeLessThanOrEqual(100.5);
    expect(steps).toBeLessThan(120);
  });

  test("an underdamped spring overshoots", () => {
    expect(run(0.55).peak).toBeGreaterThan(101);
  });

  test("a stationary spring on its target stays put", () => {
    expect(springStep({ x: 5, v: 0 }, 5, 0.3, 1, 1 / 60)).toEqual({
      x: 5,
      v: 0,
    });
  });
});

function fakeScheduler() {
  let time = 0;
  let pending: ((t: number) => void) | null = null;
  const scheduler: Scheduler = {
    request: (step) => {
      pending = step;
      return 1;
    },
    cancel: () => {
      pending = null;
    },
    now: () => time,
  };
  const tick = (ms: number) => {
    time += ms;
    const step = pending;
    pending = null;
    step?.(time);
  };
  return { scheduler, tick, isPending: () => pending !== null };
}

describe("spring", () => {
  test("drives updates to the target, then calls onDone once", () => {
    const { scheduler, tick, isPending } = fakeScheduler();
    const values: number[] = [];
    let done = 0;
    spring(
      {
        from: 0,
        to: 1,
        response: 0.2,
        onUpdate: (v) => values.push(v),
        onDone: () => done++,
      },
      scheduler,
    );
    for (let i = 0; i < 200 && isPending(); i++) tick(16);
    expect(values.at(-1)).toBe(1);
    expect(done).toBe(1);
    expect(isPending()).toBe(false);
  });

  test("cancel stops further updates", () => {
    const { scheduler, tick } = fakeScheduler();
    const values: number[] = [];
    const cancel = spring(
      { from: 0, to: 1, onUpdate: (v) => values.push(v) },
      scheduler,
    );
    tick(16);
    cancel();
    tick(16);
    expect(values).toHaveLength(1);
  });

  test("caps a long frame so a stalled tab does not explode", () => {
    const { scheduler, tick } = fakeScheduler();
    const values: number[] = [];
    spring({ from: 0, to: 1, onUpdate: (v) => values.push(v) }, scheduler);
    tick(5000);
    expect(Math.abs(values[0])).toBeLessThan(2);
  });
});

describe("project and rubber", () => {
  test("project is the rest distance of a fling", () => {
    expect(project(1000, 0.99)).toBeCloseTo(99);
    expect(project(-1000, 0.99)).toBeCloseTo(-99);
    expect(project(0)).toBe(0);
  });

  test("rubber resists more the further it is pulled, and never passes the dimension", () => {
    const near = rubber(10, 300);
    const far = rubber(200, 300);
    expect(near).toBeGreaterThan(0);
    expect(near).toBeLessThan(10);
    expect(far / 200).toBeLessThan(near / 10);
    expect(rubber(1e6, 300)).toBeLessThanOrEqual(300);
    expect(rubber(-10, 300)).toBeCloseTo(-near);
  });
});
