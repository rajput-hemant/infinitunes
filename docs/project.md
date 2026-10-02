# Project setup and deployment

Moved from the root README. Source of truth for building, running and deploying Infinitunes.

## Building from Source

This is a Bun monorepo. The web app lives in `apps/web`.

- Fetch latest source code from master branch.

```
git clone https://github.com/rajput-hemant/infinitunes
cd infinitunes
```

- Rename **.env.example** => **.env.local**, add your own environment variables.

- Install dependencies and start the dev server:

```
bun install
bun dev
```

- Other useful commands (run from the repo root):

```
bun run build        # Production build
bun run lint         # Lint with Oxlint
bun run fmt:check    # Check formatting with oxfmt
bun run type-check   # Type check with TypeScript
bun test             # Run tests
```

## Docker and Makefile


- Build the Docker Image and start the container:

```
make build
make start
```

- Stop the Docker container:

```
make stop
```

- Other Makefile targets:

```
make install         # Install dependencies
make dev             # Start dev server
make lint            # Run linting and format checks
make typecheck       # Run type checking
make test            # Run tests
make build-app       # Production build
```

## Deploy Your Own

You can deploy your own hosted version of `infinitunes` to Vercel.

#### Vercel Setup

When importing the repository into Vercel, configure the following:

| Setting              | Value           |
| -------------------- | --------------- |
| **Framework Preset** | Next.js         |
| **Root Directory**   | `apps/web`      |
| **Install Command**  | `bun install`   |
| **Build Command**    | `bun run build` |
| **Output Directory** | `.next`         |

#### Required Environment Variables

Set these in your Vercel project settings:

| Variable                   | Description                                       |
| -------------------------- | ------------------------------------------------- |
| `AUTH_SECRET`              | Secret for Better Auth sessions                   |
| `AUTH_URL`                 | Your deployed app URL (for Better Auth)           |
| `NEXT_PUBLIC_APP_URL`      | Public app URL (optional, fallback to default)    |
| `JIOSAAVN_DES_KEY`         | DES key to decrypt JioSaavn media URLs            |
| `GOOGLE_CLIENT_ID`         | Google OAuth client ID (optional unless prod)     |
| `GOOGLE_CLIENT_SECRET`     | Google OAuth client secret (optional unless prod) |
| `GITHUB_CLIENT_ID`         | GitHub OAuth client ID (optional unless prod)     |
| `GITHUB_CLIENT_SECRET`     | GitHub OAuth client secret (optional unless prod) |
| `DATABASE_URL`             | PostgreSQL connection string                      |
| `UPSTASH_REDIS_REST_URL`   | Upstash Redis URL (optional, rate limiting)       |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token (optional, rate limiting)     |
| `UMAMI_WEBSITE_ID`         | Umami analytics website ID (optional)             |

[![Deploy with Vercel][deploy]][deploy-link]

#### [JioSaavn API (Unofficial)][api] by [me][cc], [API Docs][api-docs]

[deploy]: https://vercel.com/button
[deploy-link]: https://vercel.com/new/clone?repository-url=https://github.com/rajput-hemant/infinitunes&root-directory=apps%2Fweb&install-command=bun%20install&build-command=bun%20run%20build&env=AUTH_SECRET,AUTH_URL,JIOSAAVN_DES_KEY,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,GITHUB_CLIENT_ID,GITHUB_CLIENT_SECRET,DATABASE_URL&project-name=infinitunes&repo-name=infinitunes
[api]: https://github.com/rajput-hemant/jiosaavn-api-ts
[api-docs]: https://docs-jiosaavn.netlify.app/
[cc]: https://github.com/rajput-hemant
