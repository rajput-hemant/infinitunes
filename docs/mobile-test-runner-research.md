# Mobile test runner decision (2026-10-30)

Keep Jest. The Vitest spike fails the compatibility gate: 139 of the same 182
files fail after bounded setup/configuration fixes. Faster failed execution is
not evidence of a faster equivalent test run. No Vitest dependencies, config,
test changes, or lockfile changes remain.

## Measurements

Base: `feat/platforms` at `9c35c94f02f14b6a1600fe037616f4660a6476ec`, isolated
worktree branch `t3/d1d6af94`. Bun 1.4.4, Node 26.13.0, macOS, 11 logical CPUs.
Every runner invocation used `--maxWorkers=2`, sequentially; no Metro, servers,
or simulators were started. Other users' processes were left running. Initial
load was 13.43, later 24.36, including another test workload and an existing
simulator app. These are individual observations, not five-run medians or a
controlled CPU/memory benchmark.

RSS is `/usr/bin/time -l`'s maximum resident set size, converted from bytes to
MiB. It is not a simultaneous sum of the entire worker process tree. CPU seconds
are user + system time, not instantaneous CPU utilization.

| Run | Wall seconds | CPU seconds | Peak RSS MiB | Files passed / failed / skipped | Tests passed / failed / skipped |
| --- | ---: | ---: | ---: | --- | --- |
| Original Jest, first run | 100.73 | 210.35 | 2409.7 | 181 / 0 / 1 | 1949 / 0 / 23 |
| Original Jest, warm repeat | 45.23 | 110.45 | 2064.6 | 181 / 0 / 1 | 1949 / 0 / 23 |
| Vitest 5, direct Vite peer fixed | 17.18 | 47.30 | 397.8 | 0 / 182 / 0 | 0 executed |
| Vitest 4, tsconfig resolution fixed | 19.80 | 46.57 | 308.6 | 0 / 182 / 0 | 0 executed |
| Vitest 4, preset setup adaptation | 39.15 | 65.67 | 489.9 | 42 / 140 / 0 | 964 / 22 / 0 |
| Vitest 4, final bounded fixes | 48.98 | 80.04 | 404.7 | 43 / 139 / 0 | 1001 / 71 / 0 |
| Retained Jest, new cache first run | 74.16 | 174.83 | 1550.5 | 181 / 0 / 1 | 1949 / 0 / 23 |
| Retained Jest, warm repeat | 41.00 | 98.36 | 1378.7 | 181 / 0 / 1 | 1949 / 0 / 23 |

The live upstream suite (`e2e/live-screens.test.tsx`) is intentionally skipped by
Jest without `MOBILE_E2E_LIVE_DIR`. Vitest fails during its imports instead.
Vitest JSON's `numTotalTestSuites` also counts nested describes (316 in the final
run); file counts above come from the 182 `testResults` entries, making the
comparison consistent with Jest. Hundreds of tests never register under Vitest.

The original warm repeat is already faster than the final failed Vitest run.
Cache warmup and changing shared-machine load explain why the initial Jest
number cannot be used alone to claim a 30% improvement. Since the correctness
gate fails, no five-run performance adoption experiment was warranted.

## Spike and blockers

Installed `vitest-expo@57.1.0` + `vitest-native@0.13.0`; tried Vitest 5.0.5 /
Vite 8.3.5 and Vitest 4.1.12 / Vite 7.3.7. The native engine ran React Native
0.88.0. `vitest-expo migrate` generated aliases and setup files from the existing
Jest config. Tests themselves stayed unchanged. The native migration analyzer
was also inspected; no second independent native-only full run was performed.

The spike added direct peers (`vite`, `@babel/core`,
`@react-native/babel-preset@0.88.0`, `test-renderer@1.3.0`, finally
`esbuild@0.28.2`) because transitive peers are not necessarily reachable from the
app under Bun's isolated linker. It preserved the app React, `expo-audio`, CSS
and `~/` aliases, `clearMocks`, a 30-second timeout and sequential setup ordering.

| Boundary | Observed result and examples |
| --- | --- |
| Expo SDK / isolated package resolution | Published Expo preset is SDK 57; `vitest-expo@58` does not exist in the registry. Both Vite generations failed resolving `expo/tsconfig.base`; using the exported `expo/tsconfig.base.json` unblocked this in the spike only. |
| Reanimated runtime | Existing global `setUpTests()` fails in all 182 files because the preset mock does not export it. Removing that call and the redundant Gesture Handler Jest setup exposed later failures. `components/bar-scrim.test.tsx` then fails because `getAnimatedStyle` is missing. This sacrifices the current real-Reanimated test runtime. |
| Native Babel transform | 107 final failed files report a reentrant `@react-native/babel-preset` transform, usually through `expo-glass-effect`, also `expo-image`/`expo-constants`. Excluding the preset by package name did not remove the cycle in the isolated layout. Includes `navigation/routes.test.tsx`, `features/auth/auth-routes.test.tsx` and the skipped live-data file. |
| Jest APIs / mock factories | 11 final files fail mock-factory initialization. Actual assertions also fail on unsupported `jest.replaceProperty` (downloads, notifications, sheet inset, result subtitles, text) and `jest.isolateModules` (appearance, query-client config). Relative requires resolve from the preset setup in some cases (`./tokens`, `./trpc`). `lib/trpc.test.ts` cannot resolve `./trpc`, so the current registry/real-module boundary is not preserved. Hoisting errors alone do not prove every factory has an invalid closure. |
| Expo Router | Installed `expo-router/testing-library` uses Jest timers and mock/requireActual calls; its native mocks differ from this project's real-Reanimated setup. The route files fail earlier in Babel transformation, so an independent router incompatibility was not established. The alternative `vitest-expo/router` would require separate behavior verification. |

These are multiple runtime, resolver, mock identity and assertion changes,
not a small config-only repair. No snapshots were rewritten or assertions
weakened to obtain a pass. Other observed assertions include a grid rounding
boundary and unexpected query-registry refusals. Revisit after SDK 58 support and an
isolated-layout reproduction of the Babel cycle are available.

Sources: [vitest-expo migration](https://github.com/niondigital/vitest-expo),
[vitest-native compatibility and migration](https://github.com/danfry1/vitest-native).
Repository claims were checked against the installed packages and actual runs.

## Retained Jest changes

- Two workers by default, including CI, to avoid consuming all shared CPUs.
- `workerIdleMemoryLimit: "1GB"` recycles retained heaps after a suite. It does
  not cap active-suite RSS; restarting workers can cost time.
- Worktree-local transform cache at `apps/mobile/node_modules/.cache/jest`,
  already ignored through `node_modules`. Jest's previous default also cached;
  this makes ownership explicit rather than introducing caching for the first time.
- `bun run test:mobile:related src/lib/haptics.ts` from the root forwards to
  `jest --findRelatedTests`. Paths are mobile-relative. Shared test setup/config
  changes still require the full suite. No matching tests fails rather than
  silently succeeding.

No workflow contains a direct Jest reference requiring migration. The root
`test:mobile` continues forwarding to the app's existing `test: jest` script.
See [Jest worker recycling](https://jestjs.io/docs/configuration#workeridlememorylimit-numberstring)
and [related tests](https://jestjs.io/docs/cli#--findrelatedtests-spaceseparatedlistofsourcefiles).

## Reproduction and local evidence

Run from `apps/mobile` for the runner commands (after `bun install --frozen-lockfile`):

```sh
/usr/bin/time -l bun run test --maxWorkers=2 --json --outputFile=/tmp/jest.json
# During a spike with the generated config and installed dependencies:
/usr/bin/time -l bun run test --maxWorkers=2 --reporter=json --outputFile=/tmp/vitest.json
```

Original commands redirected both stdout and stderr to per-run logs under
`/private/tmp/infinitunes-test-research`. That local directory retains all raw
JSON reports, `/usr/bin/time` output, migration reports, the final spike config,
its package manifest, and `failed-files.md` listing every failing file grouped
by cause. These temporary files are not committed. The initial missing-Jest
attempt and the missing-Vite startup attempt are excluded from comparisons.

## Fallback validation

The retained configuration passed the complete suite twice (new cache and warm
repeat), each with 181 passing files and 1,949 passing tests, plus the same live
file / 23 skipped tests. Warm observations were 45.23s / 2,064.6 MiB before and
41.00s / 1,378.7 MiB after. The observed RSS reduction is 33.2%, with a 9.4% wall
time reduction; these are single warm runs on a changing shared load, not a
repeatable performance guarantee. Recycling bounds idle heaps, while active
suites still exceed 1 GB. No claim is made about total process-tree memory.

Effective Jest configuration confirms two workers, a 1,000,000,000-byte idle
heap limit and the worktree-local cache. Focused formatting/lint and
`git diff --check` passed. No application runtime, browser, native build,
server, or device checks were needed for these runner/script changes.

The root related-tests command for `src/lib/haptics.ts` executed 102 passing
files / 866 passing tests plus one skipped file / 23 tests, exiting zero in
27.633s runner time. Haptics is shared widely, so this selects much of the app.
It emitted Jest's worker-force-exit/teardown warning; the command is functional,
but that run is not evidence that selected suites release every timer. The
full fallback runs above exited cleanly. No teardown warning was suppressed.
