import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Preloaded by `bun run test:dom` (see bunfig.toml next to this file) so the DOM
// exists before React DOM evaluates. It lives in its own process because a DOM
// global would leak into the node-style tests in `packages/core/tests`.
GlobalRegistrator.register({ url: "http://localhost:3000/" });

// React checks this flag before warning about un-wrapped `act` updates.
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
