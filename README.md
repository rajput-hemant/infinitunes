<div align=center>

<!-- labels -->

![][ci] ![][views] ![][stars] ![][forks] ![][issues] ![][license] ![][repo-size]

<!-- logo/title -->

<picture>
  <source media="(prefers-color-scheme: dark, (max-width:300px))" srcset="./apps/web/public/images/logo1920.png">
  <source media="(prefers-color-scheme: light,(max-width:300px))" srcset="./apps/web/public/images/logo1500.png">
  <img src="./apps/web/public/images/logo1920.png" width="300px" alt="infinitunes">
</picture>

### [WIP] A Simple Music Player Web App made with Next.js + Tailwind.

<picture>
  <source media="(prefers-color-scheme: light)" srcset="https://graph.org/file/12ea4beff2367f40f13ce.png">
  <source media="(prefers-color-scheme: dark)" srcset="https://graph.org/file/16937ebb693470d804f31.png">
  <img src="https://graph.org/file/12ea4beff2367f40f13ce.png" alt="infinitunes">
</picture>

**[<kbd> <br> &nbsp;**Live Demo**&nbsp; <br> </kbd>][site]**

## Building from Source

</div>

This is a Bun monorepo. The web app lives in `apps/web`.

### Prerequisites

- [Bun](https://bun.sh) (v1.4.2)
- [Docker](https://www.docker.com/)

### Quick Start

1. Clone repository and install dependencies:

```bash
git clone https://github.com/rajput-hemant/infinitunes
cd infinitunes
bun install
```

2. Configure environment:

```bash
cp .env.example .env
```

3. Start local infrastructure (PostgreSQL 18 & Redis):

```bash
bun run db:up
```

4. Run migrations and seed deterministic local data:

```bash
bun run db:migrate
bun run db:seed
```

5. Start the development server on host:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with default credentials:

- **Email:** `local@example.test`
- **Password:** `LocalDev123!`

For detailed architecture, table prefixing and configuration, see the [Local Development Guide](docs/local-development.md).

### Useful Scripts

```bash
bun run db:up        # Start PostgreSQL & Redis in Docker
bun run db:down      # Stop local infrastructure
bun run db:migrate   # Run database migrations
bun run db:seed      # Seed local deterministic data
bun run dev          # Start Next.js development server
bun run build        # Production build
bun run lint         # Lint with Oxlint
bun run fmt:check    # Check formatting with oxfmt
bun run type-check   # Type check with TypeScript
bun run test         # Run tests (plain + DOM suites)
```

<div align=center>

### Deploy Your Own

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

| Variable                            | Description                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------- |
| `AUTH_SECRET`                       | Secret for Better Auth sessions                                                       |
| `AUTH_URL`                          | Your deployed app URL (for Better Auth)                                               |
| `NEXT_PUBLIC_APP_URL`               | Public app URL (optional, fallback to default)                                        |
| `JIOSAAVN_DES_KEY`                  | DES key to decrypt JioSaavn media URLs                                                |
| `GOOGLE_CLIENT_ID`                  | Google OAuth client ID (optional unless prod)                                         |
| `GOOGLE_CLIENT_SECRET`              | Google OAuth client secret (optional unless prod)                                     |
| `GITHUB_CLIENT_ID`                  | GitHub OAuth client ID (optional unless prod)                                         |
| `GITHUB_CLIENT_SECRET`              | GitHub OAuth client secret (optional unless prod)                                     |
| `DATABASE_URL`                      | PostgreSQL connection string                                                          |
| `UPSTASH_REDIS_REST_URL`            | Upstash Redis URL (optional, rate limiting)                                           |
| `UPSTASH_REDIS_REST_TOKEN`          | Upstash Redis token (optional, rate limiting)                                         |
| `ENABLE_RATE_LIMITING`              | `true`/`false` rate limiting toggle (default `false`)                                 |
| `RATE_LIMITING_REQUESTS_PER_SECOND` | Rate limit per second (default `50`)                                                  |
| `UMAMI_WEBSITE_ID`                  | Umami analytics website ID (optional)                                                 |
| `RESEND_API_KEY`                    | [Resend](https://resend.com) key for password-reset email (see below)                 |
| `EMAIL_FROM`                        | Verified sender, e.g. `Infinitunes <no-reply@yourdomain.com>` (required with the key) |

**Password reset email.** `/forgot-password` emails a single-use link (valid 1 hour; resetting signs out every device) via Resend's REST API. Without `RESEND_API_KEY` the link is printed to the server console in development; in production it fails closed: no email is sent, the error is logged (without the link) and the user still sees the generic "If an account exists..." message, so set both variables before deploying. The request endpoint is limited to 3 requests per minute per IP (Better Auth's in-memory limiter, production only, per server instance).

[![Deploy with Vercel][deploy]][deploy-link]

#### [JioSaavn API (Unofficial)][api] by [me][cc], [API Docs][api-docs]

## Star History

<a href="https://star-history.com/#rajput-hemant/infinitunes">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=rajput-hemant/infinitunes&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=rajput-hemant/infinitunes" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=rajput-hemant/infinitunes" />
 </picture>
</a>

## Disclaimer

This project is independent of any affiliation with JioSaavn or its associated partners. It is created solely for educational purposes. Usage is at your own discretion, and the developer disclaims responsibility for any misuse or potential damage resulting from the use of this program. Please refrain from duplicating this project for commercial purposes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributors:

[![][contributors]][contributors-graph]

_Note: It may take up to 24h for the [contrib.rocks][contrib-rocks] plugin to update because it's refreshed once a day._

</div>

<!----------------------------------{ Labels }--------------------------------->

[views]: https://komarev.com/ghpvc/?username=infinitunes&label=view%20counter&color=red&style=flat
[repo-size]: https://img.shields.io/github/repo-size/rajput-hemant/infinitunes
[issues]: https://img.shields.io/github/issues-raw/rajput-hemant/infinitunes
[license]: https://img.shields.io/github/license/rajput-hemant/infinitunes
[forks]: https://img.shields.io/github/forks/rajput-hemant/infinitunes?style=flat
[stars]: https://img.shields.io/github/stars/rajput-hemant/infinitunes
[contributors]: https://contrib.rocks/image?repo=rajput-hemant/infinitunes&max=500
[contributors-graph]: https://github.com/rajput-hemant/infinitunes/graphs/contributors
[contrib-rocks]: https://contrib.rocks/preview?repo=rajput-hemant%2Finfinitunes
[ci]: https://github.com/rajput-hemant/infinitunes/actions/workflows/ci.yml/badge.svg

<!-----------------------------------{ Links }---------------------------------->

[site]: https://infinitunes.vercel.app
[deploy]: https://vercel.com/button
[deploy-link]: https://vercel.com/new/clone?repository-url=https://github.com/rajput-hemant/infinitunes&root-directory=apps%2Fweb&install-command=bun%20install&build-command=bun%20run%20build&env=AUTH_SECRET,AUTH_URL,JIOSAAVN_DES_KEY,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,GITHUB_CLIENT_ID,GITHUB_CLIENT_SECRET,DATABASE_URL&project-name=infinitunes&repo-name=infinitunes

<!------------------------------------{ api }----------------------------------->

[api]: https://github.com/rajput-hemant/jiosaavn-api-ts
[api-docs]: https://docs-jiosaavn.netlify.app/
[cc]: https://github.com/rajput-hemant
