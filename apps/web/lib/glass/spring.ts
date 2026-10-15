/**
 * Critically damped spring (Apple's response/damping parameters): `response`
 * is the period in seconds, `damping` 1 is critical, below 1 overshoots.
 * Pure step function plus a scheduler-injectable runner, so it is testable
 * without a browser.
 */
export type SpringState = { x: number; v: number };

export type SpringOptions = {
  from: number;
  to: number;
  /** Initial velocity in value units per second. */
  velocity?: number;
  response?: number;
  damping?: number;
  onUpdate: (value: number) => void;
  onDone?: () => void;
};

/** Longest step integrated at once, so a stalled tab does not explode the spring. */
const MAX_STEP_S = 0.032;

/**
 * Longest sub-step the integrator takes. Semi-implicit Euler diverges once
 * `damping coefficient * dt` passes 2 (a 0.2s response at the 32ms frame cap is
 * already 2.01), so a slow frame is split instead of integrated in one go.
 */
const MAX_SUBSTEP_S = 1 / 240;

export function springStep(
  state: SpringState,
  target: number,
  response: number,
  damping: number,
  dt: number,
): SpringState {
  const k = ((2 * Math.PI) / response) ** 2;
  const c = (4 * Math.PI * damping) / response;
  const steps = Math.max(1, Math.ceil(dt / MAX_SUBSTEP_S));
  const h = Math.max(0, dt) / steps;
  let { x, v } = state;
  for (let i = 0; i < steps; i++) {
    v += (-k * (x - target) - c * v) * h;
    x += v * h;
  }
  return { x, v };
}

export function springSettled(state: SpringState, target: number): boolean {
  return Math.abs(state.v) < 2 && Math.abs(state.x - target) < 0.5;
}

export type Scheduler = {
  request: (step: (time: number) => void) => number;
  cancel: (handle: number) => void;
  now: () => number;
};

const browserScheduler: Scheduler = {
  request: (step) => requestAnimationFrame(step),
  cancel: (handle) => cancelAnimationFrame(handle),
  now: () => performance.now(),
};

/** Runs a spring and returns a cancel function; retarget by cancelling and starting from the current value with its velocity. */
export function spring(
  {
    from,
    to,
    velocity = 0,
    response = 0.35,
    damping = 1,
    onUpdate,
    onDone,
  }: SpringOptions,
  scheduler: Scheduler = browserScheduler,
): () => void {
  let state: SpringState = { x: from, v: velocity };
  let last = scheduler.now();
  let handle = 0;
  const step = (time: number) => {
    const dt = Math.min(MAX_STEP_S, (time - last) / 1000);
    last = time;
    state = springStep(state, to, response, damping, dt);
    if (springSettled(state, to)) {
      onUpdate(to);
      onDone?.();
      return;
    }
    onUpdate(state.x);
    handle = scheduler.request(step);
  };
  handle = scheduler.request(step);
  return () => scheduler.cancel(handle);
}

/** Where a fling of velocity `v` (px/s) comes to rest, as a distance (px). */
export function project(v: number, decel = 0.998): number {
  return ((v / 1000) * decel) / (1 - decel);
}

/** Rubber band: resistance grows with the overshoot `o` against a dimension `dim`. */
export function rubber(o: number, dim: number, c = 0.55): number {
  return (o * dim * c) / (dim + c * Math.abs(o));
}
