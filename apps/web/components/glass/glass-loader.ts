type Runtime = typeof import("./start-glass-runtime");

/** Longest the engine waits for an idle moment before it starts anyway. */
const IDLE_TIMEOUT_MS = 1500;

let runtime: Runtime | null = null;
let loading: Promise<Runtime> | null = null;
/** Registrations that asked before the engine was up; each runs when it starts. */
const waiting = new Set<(loaded: Runtime) => void | (() => void)>();
/** Set by the mounted `GlassRuntime`: starts the engine now instead of at idle. */
let startNow: (() => void) | null = null;

function load(): Promise<Runtime> {
  loading ??= import("./start-glass-runtime").then((loaded) => {
    runtime = loaded;
    return loaded;
  });
  return loading;
}

/**
 * Runs `job` once the glass engine is up (at once if it already is), and
 * returns a function that cancels it and runs the job's own cleanup. The
 * engine is a separate chunk that starts on idle (see `GlassRuntime`), so
 * surfaces that hydrate first wait here, showing the frosted fallback.
 */
export function whenGlassRuns(
  job: (loaded: Runtime) => void | (() => void),
): () => void {
  let cleanup: void | (() => void);
  if (runtime?.isRunning()) {
    cleanup = job(runtime);
    return () => cleanup?.();
  }
  const queued = (loaded: Runtime) => {
    cleanup = job(loaded);
  };
  waiting.add(queued);
  return () => {
    waiting.delete(queued);
    cleanup?.();
  };
}

/** Registers a hydrated glass surface with the lens registry once the engine is up. */
export function registerWhenReady(el: HTMLElement) {
  return whenGlassRuns((loaded) => {
    if (el.isConnected) loaded.register(el);
  });
}

/** Starts the engine now: popups call it on the first intent, so their lens is ready when they open. */
export function startGlassNow() {
  startNow?.();
}

type Idle = (callback: () => void) => () => void;

const whenIdle: Idle = (callback) => {
  if (typeof requestIdleCallback === "function") {
    const id = requestIdleCallback(callback, { timeout: IDLE_TIMEOUT_MS });
    return () => cancelIdleCallback(id);
  }
  const id = setTimeout(callback, 200);
  return () => clearTimeout(id);
};

/**
 * Loads and starts the glass engine once the browser is idle (or at once, via
 * `startGlassNow`), then registers the surfaces that were waiting. Returns the
 * teardown.
 */
export function startGlassOnIdle(): () => void {
  let cancelled = false;
  let stop: (() => void) | null = null;
  let started = false;

  const run = () => {
    if (started) return;
    started = true;
    cancelIdle();
    void load().then((loaded) => {
      if (cancelled) return;
      stop = loaded.startGlassRuntime();
      for (const job of waiting) job(loaded);
      waiting.clear();
    });
  };

  const cancelIdle = whenIdle(run);
  startNow = run;

  return () => {
    cancelled = true;
    cancelIdle();
    if (startNow === run) startNow = null;
    stop?.();
  };
}
