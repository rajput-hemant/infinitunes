# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Add durable project-specific notes here as they are discovered through real work.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.

## Zod 4 API

The project uses Zod ^4.4.3. Key differences from Zod 3:

- `z.string()` no longer accepts `required_error` / `invalid_type_error`. Use `error` instead (e.g. `z.string({ error: "..." })`).
- `message` is deprecated; `error` is the replacement.
- `z.preprocess` signature accepts `(arg, ctx) => result` (second `ctx` param is new; single-arg callbacks still work).
- `z.discriminatedUnion`, `.min()`, `.max()`, `.regex()`, `.refine()` APIs are unchanged.
- See `src/lib/env.ts` and `src/lib/validations.ts` for usage examples.
