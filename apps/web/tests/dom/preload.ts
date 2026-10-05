import { mock } from "bun:test";

import { GlobalRegistrator } from "@happy-dom/global-registrator";

// Preloaded by `bun run test:dom` (see bunfig.toml next to this file) so the
// DOM exists before any test file or React DOM evaluates. It is a separate bun
// process on purpose: all test files share one process and one global scope,
// so a DOM (or the module mocks these tests need) would leak into the
// node-style tests in `apps/web/tests`. `scripts/test-isolated.ts` also runs
// each file here in its own process, since the mocks leak between files too.
GlobalRegistrator.register({ url: "http://localhost:3000/" });

// React checks this flag before warning about un-wrapped `act` updates.
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

// `server-only` throws outside a Server Component; components that import it
// transitively must load in every file, not only after a sibling mocks it.
mock.module("server-only", () => ({}));
